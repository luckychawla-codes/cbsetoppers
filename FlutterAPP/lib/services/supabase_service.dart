import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../models/folder_model.dart';
import '../models/student_model.dart';

import '../models/subject_model.dart';
import '../models/material_model.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;
  final Dio _dio = Dio();

  // PicoApps AI Details
  static const String _aiPk =
      'v1-Z0FBQUFBQnBwUzNHaVFaVWtuNTIwdHNsTUpMUGJDa0dOZVg1RHp0YXAyTG4tRkpNSERoNkNYWW9fc0RCbVJJaEE3UnlUZ0tMUEQ5bGJrejZZTUFpWk8yVWQ5T2tJRXZhbXc9PQ==';
  static const String _llmUrl =
      'https://backend.buildpicoapps.com/aero/run/llm-api?pk=$_aiPk';
  static const String _imageUrl =
      'https://backend.buildpicoapps.com/aero/run/image-generation-api?pk=$_aiPk';

  String _processUrl(String url) {
    if (url.startsWith('/assets/')) {
      return 'https://cbsetoppers.onrender.com$url';
    }
    if (url.contains('drive.google.com')) {
      // Patterns: /d/ID/view, /file/d/ID, id=ID, open?id=ID
      final reg1 = RegExp(r'\/d\/([^\/\?\&]+)');
      final reg2 = RegExp(r'[?&]id=([^&]+)');
      final match1 = reg1.firstMatch(url);
      final match2 = reg2.firstMatch(url);
      final id = match1?.group(1) ?? match2?.group(1);
      if (id != null) {
        return 'https://drive.google.com/uc?export=download&id=$id';
      }
    }

    return url;
  }

  // AUTH
  Future<StudentModel?> login(String identifier, String password) async {
    String email = identifier.trim();

    // 1. ID Lookup if identifier is not an email
    if (!email.contains('@')) {
      final response = await _client
          .from('students')
          .select('email')
          .eq('student_id', email.toUpperCase())
          .maybeSingle();

      if (response == null) {
        throw Exception('Student ID not found');
      }
      email = response['email'];
    }

    // 2. Sign In
    final AuthResponse res = await _client.auth.signInWithPassword(
      email: email.trim().toLowerCase(),
      password: password,
    );

    if (res.user != null) {
      return fetchProfile(email);
    }
    return null;
  }

  Future<int> fetchUserCount() async {
    try {
      final res = await _client.from('students').select('id');
      if (res is List) return res.length;
      return 0;
    } catch (e) {
      return 0;
    }
  }

  Future<StudentModel?> register({
    required String name,
    required String dob,
    required String studentClass,
    String? stream,
    required String email,
    String? phone,
    required String password,
    List<String>? competitiveExams,
    String gender = 'OTHER',
  }) async {
    // 1. Auth Sign Up
    final AuthResponse authRes = await _client.auth.signUp(
      email: email.trim().toLowerCase(),
      password: password,
      data: {'full_name': name.trim()},
    );

    if (authRes.user == null) throw Exception('Registration failed');

    // 2. Auto-generate student ID: CT + last 6 digits of epoch ms
    final autoId =
        'CT${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    // 3. Lookup Relation IDs
    final clsRes = await _client
        .from('classes')
        .select('id')
        .eq('name', studentClass)
        .maybeSingle();

    Map<String, dynamic>? streamRes;
    if (stream != null) {
      streamRes = await _client
          .from('streams')
          .select('id')
          .eq('name', stream)
          .maybeSingle();
    }

    List<String> examIds = [];
    if (competitiveExams != null && competitiveExams.isNotEmpty) {
      final examsRes = await _client
          .from('competitive_exams')
          .select('id')
          .inFilter('name', competitiveExams);
      examIds = List<String>.from(examsRes.map((e) => e['id'].toString()));
    }

    // 4. Insert Profile
    final profile = await _client
        .from('students')
        .insert({
          'name': name.trim(),
          'dob': dob,
          'class': studentClass,
          'stream': stream,
          'email': email.trim().toLowerCase(),
          'phone': phone?.trim(),
          'student_id': autoId,
          'gender': gender,
          'competitive_exams': competitiveExams ?? [],
          'is_verified': true,
        })
        .select()
        .single();

    return StudentModel.fromJson(profile);
  }

  Future<void> updateProfile({
    required String id,
    required String name,
    required String dob,
    required String studentClass,
    String? stream,
    String? phone,
    required String gender,
    required List<String> competitiveExams,
    String? board,
  }) async {
    try {
      final updates = {
        'name': name,
        'dob': dob,
        'class': studentClass,
        'stream': stream,
        'phone': phone,
        'gender': gender,
        'competitive_exams': competitiveExams,
      };

      // Add optional columns only if they are likely to exist or provided
      if (board != null) updates['board'] = board;

      await _client.from('students').update(updates).eq('id', id);
    } catch (e) {
      debugPrint('Update Profile Error: $e');
      rethrow;
    }
  }

  // QUIZ SYSTEM
  Future<void> saveQuizResult({
    required String studentId,
    required String topic,
    required int score,
    required int total,
    required String analysis,
  }) async {
    try {
      await _client.from('quiz_results').insert({
        'student_id': studentId,
        'topic': topic,
        'score': score,
        'total_questions': total,
        'points': score * 10, // Leaderboard requires xp/points
        'analysis': analysis,
        'created_at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      debugPrint('Save Quiz Result Error: $e');
      // Silently fail if table doesn't exist yet, but log it
    }
  }

  Future<List<Map<String, dynamic>>> fetchQuizHistory(String studentId) async {
    try {
      final response = await _client
          .from('quiz_results')
          .select()
          .eq('student_id', studentId)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> fetchLeaderboard() async {
    try {
      // 1. Fetch aggregated points from quiz_results
      final List<dynamic> results = await _client
          .from('quiz_results')
          .select('student_id, points');

      if (results.isEmpty) return [];

      // 2. Aggregate XP (Sum of points)
      final Map<String, int> xpMap = {};
      for (var r in results) {
        final sid = r['student_id'].toString();
        final points = (r['points'] as num).toInt();
        xpMap[sid] = (xpMap[sid] ?? 0) + points;
      }

      // 3. Get student names
      final List<String> studentIds = xpMap.keys.toList();
      final List<dynamic> students = await _client
          .from('students')
          .select('id, name')
          .inFilter('id', studentIds);

      final Map<String, String> nameMap = {
        for (var s in students) s['id'].toString(): s['name'].toString(),
      };

      // 4. Create final ranked list
      final List<Map<String, dynamic>> leaderboard = [];
      xpMap.forEach((sid, xp) {
        leaderboard.add({
          'student_id': sid,
          'name': nameMap[sid] ?? 'Student',
          'xp': xp,
        });
      });

      leaderboard.sort((a, b) => (b['xp'] as int).compareTo(a['xp'] as int));
      return leaderboard; // Return all rankings
    } catch (e) {
      debugPrint('Leaderboard Error: $e');
      return [];
    }
  }

  // Fetch dynamic streams from Supabase
  Future<List<String>> fetchStreams() async {
    final List<dynamic> response = await _client
        .from('streams')
        .select('name')
        .order('name');
    return response.map((e) => e['name'].toString()).toList();
  }

  // Fetch dynamic competitive exams from Supabase
  Future<List<String>> fetchCompetitiveExams() async {
    final List<dynamic> response = await _client
        .from('competitive_exams')
        .select('name')
        .order('name');
    return response.map((e) => e['name'].toString()).toList();
  }

  // Fetch dynamic classes from Supabase
  Future<List<String>> fetchClasses() async {
    final List<dynamic> response = await _client
        .from('classes')
        .select('name')
        .order(
          'id',
        ); // Often better than name if id is a numeric sequence or intended sort
    return response.map((e) => e['name'].toString()).toList();
  }

  Future<void> sendPasswordReset(String identifier) async {
    String email = identifier.trim().toLowerCase();

    // 1. If it's a Student ID, find the email first
    if (!email.contains('@')) {
      final response = await _client
          .from('students')
          .select('email')
          .eq('student_id', email.toUpperCase())
          .maybeSingle();

      if (response != null) {
        email = response['email'];
      } else {
        throw Exception('Student ID not found');
      }
    }

    // 2. Send the reset email
    await _client.auth.resetPasswordForEmail(
      email,
      redirectTo: 'cbsetoppers://reset-password',
    );
  }

  Future<StudentModel?> fetchProfile(String email) async {
    final profile = await _client
        .from('students')
        .select()
        .ilike('email', email)
        .maybeSingle();

    if (profile != null) {
      return StudentModel.fromJson(profile);
    }

    final operator = await _client
        .from('operators')
        .select()
        .ilike('email', email)
        .maybeSingle();

    if (operator != null) {
      return StudentModel(
        id: operator['id'].toString(),
        name: operator['name'] ?? 'Operator',
        studentId:
            'OP_${operator['id'].toString().substring(0, 5).toUpperCase()}',
        email: email,
        dob: '',
        studentClass: 'Admin',
        gender: 'MALE',
        competitiveExams: [],
        competitiveExamIds: [],
        board: 'CBSE',
        isVerified: true,
        isOperator: true,
      );
    }
    return null;
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  // CONTENT
  Future<List<SubjectModel>> fetchSubjects(
    String targetClass, {
    String? targetStream,
    List<String>? exams,
  }) async {
    PostgrestFilterBuilder query = _client.from('subjects').select();

    if (targetClass != 'Admin') {
      // 1. Initial filter by class using array contains
      query = query.contains('target_classes', [targetClass]);
    }

    final List<dynamic> response = await query.order('order_index');

    List<SubjectModel> subjects = response.map((s) {
      final processed = Map<String, dynamic>.from(s);
      if (processed['icon_url'] != null) {
        processed['icon_url'] = _processUrl(processed['icon_url']);
      }
      return SubjectModel.fromJson(processed);
    }).toList();

    // Client-side additional filtering if not Admin
    if (targetClass != 'Admin') {
      return subjects.where((s) {
        final stStreams = s.targetStreams ?? [];
        final stExams = s.targetExams ?? [];

        // Stream Check: empty list means all, otherwise must match user stream
        bool matchesStream =
            stStreams.isEmpty ||
            (targetStream != null && stStreams.contains(targetStream));

        // Competitive Exam Check: empty list means all, otherwise must overlap with user exams
        bool matchesExam =
            stExams.isEmpty ||
            (exams != null && exams.any((e) => stExams.contains(e)));

        return matchesStream && matchesExam;
      }).toList();
    }

    return subjects;
  }

  Future<List<FolderModel>> fetchFolders(
    String subjectId, {
    String? parentId,
  }) async {
    var query = _client.from('folders').select().eq('subject_id', subjectId);
    if (parentId != null) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.filter('parent_id', 'is', null);
    }
    final List<dynamic> response = await query.order('order_index');
    return response.map((f) => FolderModel.fromJson(f)).toList();
  }

  Future<List<MaterialModel>> fetchMaterials(
    String subjectId, {
    String? folderId,
  }) async {
    var query = _client.from('materials').select().eq('subject_id', subjectId);
    if (folderId != null) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.filter('folder_id', 'is', null);
    }
    final List<dynamic> response = await query.order('order_index');
    return response.map((m) {
      final processed = Map<String, dynamic>.from(m);
      if (processed['url'] != null) {
        processed['url'] = _processUrl(processed['url']);
      }
      return MaterialModel.fromJson(processed);
    }).toList();
  }

  Future<List<MaterialModel>> fetchLatestMaterials({
    String? targetClass,
    int limit = 10,
  }) async {
    final List<dynamic> response = await _client
        .from('materials')
        .select()
        .order('created_at', ascending: false)
        .limit(limit);
    return response.map((m) {
      final processed = Map<String, dynamic>.from(m);
      if (processed['url'] != null) {
        processed['url'] = _processUrl(processed['url']);
      }
      return MaterialModel.fromJson(processed);
    }).toList();
  }

  Future<String> fetchDailyQuote(StudentModel? student) async {
    try {
      final name = student?.name.split(' ')[0] ?? 'Student';
      final prompt =
          "Generate a short, powerful, and inspiring motivational quote (max 15 words) "
          "for a student named $name who is in class ${student?.studentClass ?? 'X'}. "
          "Make it unique and academic-focused. Return ONLY the quote text.";

      final response = await _dio.post(
        'https://cbsetopper.tarun-pncml123.workers.dev',
        data: {'question': prompt},
        options: Options(responseType: ResponseType.plain),
      );
      if (response.statusCode == 200) {
        return response.data?.toString() ?? "Your only limit is your mind.";
      }
      return "Believe in yourself and all that you are.";
    } catch (e) {
      return "Education is the most powerful weapon.";
    }
  }

  // AI CHAT (BuildPicoapps PicoApps API)
  Future<String> chatWithAI(
    String userMessage, {
    StudentModel? student,
    bool isQuizMode = false,
  }) async {
    try {
      String studentContext = "";
      if (student != null) {
        studentContext =
            "User Profile: Name: ${student.name}, Class: ${student.studentClass}, Stream: ${student.stream ?? 'N/A'}, Board: ${student.board}, Exams: ${student.competitiveExams.join(', ')}. ";
      }

      final systemPersona =
          "You are TopperAI, a friendly, professional career guide and academic specialist. "
          "You specialize in CBSE, ICSE, State Boards, JEE, NEET, CUET, NDA, and other competitive exams. "
          "$studentContext"
          "ADVANCED CAPABILITIES: You are an elite AI with scientific reasoning and visualization capabilities. "
          "1. MATHEMATICS: Use LaTeX syntax for all equations (inline: \$E=mc^2\$, block: \$\$ ... \$\$). "
          "2. VISUALS: If asked for a graph or chart, provide a Markdown Table or Mermaid diagram. "
          "3. QUIZ GENERATION: If asked for a quiz (not in quiz mode), respond in JSON format only. "
          'JSON Structure: {"type": "quiz", "topic": "TOPIC", "questions": [{"question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..."}]} '
          "CRITICAL: correctIndex must be 0-3 matching the correct option. "
          "MATH FORMATTING: ALWAYS use \$...\$ for inline math and \$\$...\$\$ for block math. "
          "Follow instructions precisely! If the user asks to generate, create or make an image, photo, or picture by describing it, "
          "You will reply with /image + description. Otherwise, You will respond normally. Avoid additional explanations.";

      String prompt;
      if (isQuizMode) {
        // In quiz mode, ONLY output the raw JSON - no system persona fluff
        final quizInstruction =
            "You are a highly accurate quiz generator for academic subjects. "
            "$studentContext"
            "TASK: Generate a multiple-choice quiz based on the user's request.\n"
            "CRITICAL RULES — follow EVERY rule with no exceptions:\n"
            "1. Output ONLY the raw JSON object. No markdown, no code fences (no ```), no explanation text before or after.\n"
            "2. The response must begin with '{' and end with '}'. Nothing else.\n"
            "3. JSON structure MUST be exactly: {\"type\": \"quiz\", \"topic\": \"TOPIC_NAME\", \"questions\": [...]}\n"
            "4. Each question MUST have: {\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctIndex\": N, \"explanation\": \"...\"}\n"
            "5. 'options' MUST contain exactly 4 strings.\n"
            "6. 'correctIndex' is a zero-based integer (0=A, 1=B, 2=C, 3=D).\n"
            "7. Generate EXACTLY the number of questions requested by the user. Do NOT stop early.\n"
            "8. If 15 questions are requested, the 'questions' array MUST have exactly 15 items.\n"
            "9. All 4 options must be distinct, plausible, and academically accurate.\n"
            "10. Explanations must clearly state WHY the correct answer is right.\n"
            "11. For math/science questions, write equations in plain text (e.g., E=mc^2, F=ma).\n"
            "12. Do NOT include any LaTeX or markdown inside the JSON strings.\n\n"
            "User request: $userMessage";
        prompt = quizInstruction;
      } else {
        prompt = '$systemPersona\n\nUser: $userMessage';
      }

      // Use PicoApps LLM API
      final response = await _dio.post(
        _llmUrl,
        data: {'prompt': prompt},
        options: Options(
          headers: {'Content-Type': 'application/json'},
          responseType: ResponseType.json,
        ),
      );

      if (response.statusCode == 200) {
        String aiText = '';
        final responseData = response.data;
        if (responseData is Map && responseData['status'] == 'success') {
          aiText = responseData['text']?.toString() ?? '';
        } else if (responseData is String) {
          aiText = responseData;
        }

        if (aiText.isEmpty) {
          return 'TopperAI is thinking... Please try again!';
        }

        // Handle image generation trigger
        if (aiText.trimLeft().startsWith('/image')) {
          final description = aiText.replaceFirst('/image', '').trim();
          return await generateImage(description);
        }
        return aiText;
      }
      return 'TopperAI is currently processing another query. Please try again in a moment!';
    } catch (e) {
      return 'Connection Error: $e';
    }
  }

  Future<String> generateImage(String description) async {
    try {
      final response = await _dio.post(
        _imageUrl,
        data: {'prompt': description},
        options: Options(
          headers: {'Content-Type': 'application/json'},
          responseType: ResponseType.json,
        ),
      );
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map &&
            data['status'] == 'success' &&
            data['imageUrl'] != null) {
          return 'IMAGE_URL:${data['imageUrl']}';
        }
      }
      return 'Image Generation Error';
    } catch (e) {
      return 'Image Error: $e';
    }
  }
}
