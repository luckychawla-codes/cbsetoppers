import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:uuid/uuid.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as types;
import 'package:markdown/markdown.dart' as md;
import 'dart:convert';
import 'dart:ui';

import '../../../providers/auth_provider.dart';
import '../../../providers/supabase_provider.dart';
import '../../../services/chat_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/quiz_model.dart';
import '../../../ui/screens/quiz_screen.dart';
import '../../../core/constants/app_constants.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final List<types.Message> _messages = [];
  final _chatService = ChatService();
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isLoadingHistory = true;
  bool _isTyping = false;
  bool _isQuizMode = false;

  final _aiUser = const types.User(
    id: 'topper-ai',
    firstName: 'TopperAI',
    imageUrl:
        'https://hkdkhzfdmvcxvopasohm.supabase.co/storage/v1/object/public/assets/topper-ai.png',
  );

  late types.User _user;
  late String _studentId;

  @override
  void initState() {
    super.initState();
    final student = ref.read(authProvider).value;
    // IMPORTANT: use student.id (UUID) as the Firebase key, not studentId code
    _studentId = student?.id ?? 'guest';
    _user = types.User(
      id: student?.id ?? 'user',
      firstName: student?.name.split(' ')[0] ?? 'Student',
    );
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoadingHistory = true);
    try {
      final history = await _chatService.loadHistory(_studentId);
      if (mounted) {
        setState(() {
          _messages.clear();
          _messages.addAll(history);
          _isLoadingHistory = false;
        });
        if (_messages.isEmpty) _addWelcomeMessage(save: false);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingHistory = false);
        _addWelcomeMessage(save: false);
      }
    }
  }

  void _addWelcomeMessage({bool save = true}) {
    final student = ref.read(authProvider).value;
    final firstName = student?.name.split(' ')[0] ?? 'there';
    final msg = types.TextMessage(
      author: _aiUser,
      createdAt: DateTime.now().millisecondsSinceEpoch,
      id: const Uuid().v4(),
      text:
          '### Hi $firstName! 👋\nI\'m **TopperAI**, your adaptive mentor. How can I boost your productivity today? Whether it\'s a quick quiz, a tough concept, or just some motivation, I\'ve got you covered! 🧪✨',
    );
    _insertMessage(msg, save: save);
  }

  void _insertMessage(types.Message message, {bool save = true}) {
    setState(() => _messages.insert(0, message));
    if (save) {
      _chatService.saveMessage(studentId: _studentId, message: message);
    }
  }

  Future<void> _handleSend() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    final userMsg = types.TextMessage(
      author: _user,
      createdAt: DateTime.now().millisecondsSinceEpoch,
      id: const Uuid().v4(),
      text: text,
    );

    _insertMessage(userMsg);
    _textController.clear();
    setState(() => _isTyping = true);

    try {
      final student = ref.read(authProvider).value;
      final response = await ref
          .read(supabaseServiceProvider)
          .chatWithAI(text, student: student, isQuizMode: _isQuizMode);

      if (mounted) {
        setState(() => _isTyping = false);

        types.Message aiMessage;
        if (response.startsWith('IMAGE_URL:')) {
          aiMessage = types.ImageMessage(
            author: _aiUser,
            createdAt: DateTime.now().millisecondsSinceEpoch,
            id: const Uuid().v4(),
            name: 'Image',
            size: 1024,
            uri: response.replaceFirst('IMAGE_URL:', ''),
          );
        } else {
          aiMessage = types.TextMessage(
            author: _aiUser,
            createdAt: DateTime.now().millisecondsSinceEpoch,
            id: const Uuid().v4(),
            text: response,
          );
        }
        _insertMessage(aiMessage);
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isTyping = false);
        _insertMessage(
          types.TextMessage(
            author: _aiUser,
            createdAt: DateTime.now().millisecondsSinceEpoch,
            id: const Uuid().v4(),
            text: '⚠️ OOPS! Something went wrong. Check your connection?',
          ),
        );
      }
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      extendBodyBehindAppBar: true,
      appBar: _buildAppBar(isDark),
      body: Stack(
        children: [_buildMessageList(isDark), _buildInputArea(isDark)],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(bool isDark) {
    return PreferredSize(
      preferredSize: const Size.fromHeight(80),
      child: ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: AppBar(
            backgroundColor: isDark
                ? Colors.black.withOpacity(0.2)
                : Colors.white.withOpacity(0.5),
            elevation: 0,
            leading: IconButton(
              icon: Icon(
                Icons.arrow_back_ios_new_rounded,
                color: isDark ? Colors.white : Colors.black87,
              ),
              onPressed: () => Navigator.pop(context),
            ),
            title: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryColor.withOpacity(0.3),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.psychology_rounded,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'TopperAI',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                      ),
                    ),
                    Row(
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Adaptive Mentor',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.delete_sweep_rounded),
                onPressed: _clearHistory,
              ),
              const SizedBox(width: 8),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _clearHistory() async {
    await _chatService.clearHistory(_studentId);
    setState(() => _messages.clear());
    _addWelcomeMessage(save: false);
  }

  Widget _buildMessageList(bool isDark) {
    if (_isLoadingHistory) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(20, 120, 20, 110),
      reverse: true,
      itemCount: _messages.length + (_isTyping ? 1 : 0) + 1,
      itemBuilder: (context, index) {
        if (index == _messages.length + (_isTyping ? 1 : 0)) {
          return _buildDisclaimer(isDark);
        }
        if (_isTyping && index == 0) {
          return _buildTypingIndicator(isDark);
        }
        final message = _messages[_isTyping ? index - 1 : index];
        return _buildChatBubble(message, isDark);
      },
    );
  }

  Widget _buildDisclaimer(bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24, top: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.03) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, size: 18, color: Colors.grey),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              AppConstants.aiDisclaimer,
              style: GoogleFonts.outfit(
                fontSize: 10,
                color: Colors.grey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatBubble(types.Message msg, bool isDark) {
    final isAi = msg.author.id == 'topper-ai';
    final text = (msg is types.TextMessage) ? msg.text : '';
    final imageUrl = (msg is types.ImageMessage) ? msg.uri : null;
    final timestamp = DateTime.fromMillisecondsSinceEpoch(msg.createdAt ?? 0);

    // ROBUST QUIZ DETECTION: Handle AI response which might be wrapped in markdown or have intro text
    bool isQuiz =
        isAi &&
        (text.contains('"type": "quiz"') ||
            text.contains('"type":"quiz"') ||
            text.contains('"questions": [') ||
            text.contains('"questions":['));
    if (isQuiz) {
      try {
        // Extract JSON from various wrapping formats
        String jsonPart = text;

        // 1. Remove markdown code fences
        if (text.contains('```json')) {
          jsonPart = text.split('```json')[1].split('```')[0].trim();
        } else if (text.contains('```')) {
          jsonPart = text.split('```')[1].split('```')[0].trim();
        } else {
          // 2. Extract the outermost JSON object
          int firstBrace = text.indexOf('{');
          int lastBrace = text.lastIndexOf('}');
          if (firstBrace != -1 && lastBrace != -1) {
            jsonPart = text.substring(firstBrace, lastBrace + 1);
          }
        }

        // 3. Try to decode; be lenient about trailing text
        dynamic decoded;
        try {
          // Clean the string of hidden unicode characters or non-printable chars
          jsonPart = jsonPart.replaceAll(
            RegExp(r'[\u0000-\u001F\u007F-\u009F]'),
            '',
          );
          decoded = jsonDecode(jsonPart);
        } catch (_) {
          // If decoding failed, it might be due to unescaped quotes or extra text
          // Try a more aggressive regex to find the largest { ... }
          final match = RegExp(r'\{.*\}', dotAll: true).firstMatch(text);
          if (match != null) {
            try {
              decoded = jsonDecode(match.group(0)!);
            } catch (e2) {
              debugPrint('Nested JSON parse error: $e2');
            }
          }
        }

        if (decoded is Map &&
            (decoded['type'] == 'quiz' || decoded['questions'] is List)) {
          final quiz = QuizModel.fromJson(decoded as Map<String, dynamic>);
          // show quiz launcher widget only if we have at least 1 question
          if (quiz.questions.isNotEmpty) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (text.length > jsonPart.length + 20)
                  _buildMessageBody(
                    text.split('{')[0].trim(),
                    isDark,
                    isAi,
                    timestamp,
                  ),
                _buildQuizLauncher(quiz),
              ],
            );
          }
        }
      } catch (e) {
        debugPrint('Quiz parsing error: $e');
        // Fall through to normal message render
      }
    }

    return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: isAi
                ? CrossAxisAlignment.start
                : CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisAlignment: isAi
                    ? MainAxisAlignment.start
                    : MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (isAi)
                    Container(
                      margin: const EdgeInsets.only(right: 8, bottom: 4),
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: AppTheme.primaryColor,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.psychology_rounded,
                          size: 16,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isAi
                            ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                            : AppTheme.primaryColor,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(22),
                          topRight: const Radius.circular(22),
                          bottomLeft: Radius.circular(isAi ? 4 : 22),
                          bottomRight: Radius.circular(isAi ? 22 : 4),
                        ),
                        boxShadow: isDark
                            ? []
                            : [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                        border: isAi && isDark
                            ? Border.all(color: Colors.white.withOpacity(0.05))
                            : null,
                      ),
                      child: imageUrl != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                imageUrl,
                                errorBuilder: (_, __, ___) =>
                                    const Icon(Icons.broken_image),
                              ),
                            )
                          : MarkdownBody(
                              data: _processTextForMath(text),
                              builders: {
                                'latex': LatexBuilder(
                                  style: GoogleFonts.outfit(
                                    color: isAi
                                        ? (isDark
                                              ? Colors.white
                                              : AppTheme.textHeadingColor)
                                        : Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              },
                              styleSheet: MarkdownStyleSheet(
                                p: GoogleFonts.outfit(
                                  color: isAi
                                      ? (isDark
                                            ? Colors.white
                                            : AppTheme.textHeadingColor)
                                      : Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  height: 1.5,
                                ),
                                code: GoogleFonts.firaCode(
                                  backgroundColor: isDark
                                      ? Colors.white.withOpacity(0.05)
                                      : Colors.black.withOpacity(0.05),
                                  fontSize: 12,
                                  color: isDark ? Colors.amber : Colors.blue,
                                ),
                                codeblockPadding: const EdgeInsets.all(16),
                                codeblockDecoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF0F172A)
                                      : Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark
                                        ? Colors.white10
                                        : Colors.grey.shade200,
                                  ),
                                ),
                              ),
                            ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${timestamp.hour}:${timestamp.minute.toString().padLeft(2, '0')}',
                style: GoogleFonts.outfit(
                  fontSize: 9,
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 400.ms)
        .slideY(begin: 0.1, curve: Curves.easeOutQuad);
  }

  Widget _buildTypingIndicator(bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          const SizedBox(width: 36),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: List.generate(
                3,
                (i) =>
                    Container(
                          margin: const EdgeInsets.symmetric(horizontal: 2),
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: AppTheme.primaryColor,
                            shape: BoxShape.circle,
                          ),
                        )
                        .animate(onPlay: (c) => c.repeat())
                        .scale(
                          delay: (i * 150).ms,
                          duration: 600.ms,
                          begin: const Offset(0.5, 0.5),
                          end: const Offset(1.2, 1.2),
                        )
                        .fadeOut(begin: 0.5),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea(bool isDark) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: EdgeInsets.fromLTRB(
              20,
              10,
              20,
              MediaQuery.of(context).padding.bottom + 10,
            ),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.black.withOpacity(0.6)
                  : Colors.white.withOpacity(0.9),
              border: Border(
                top: BorderSide(
                  color: isDark ? Colors.white10 : Colors.grey.shade200,
                ),
              ),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(
                    Icons.add_circle_outline_rounded,
                    color: _isQuizMode ? AppTheme.primaryColor : Colors.grey,
                    size: 28,
                  ),
                  onPressed: () => _showModeSelector(context, isDark),
                ),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withOpacity(0.05)
                          : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: TextField(
                      controller: _textController,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                      decoration: InputDecoration(
                        hintText: _isQuizMode
                            ? 'Ask for a subject/chapter quiz...'
                            : 'Ask anything...',
                        hintStyle: GoogleFonts.outfit(
                          color: Colors.grey,
                          fontWeight: FontWeight.normal,
                        ),
                        border: InputBorder.none,
                      ),
                      onSubmitted: (_) => _handleSend(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(
                    color: AppTheme.primaryColor,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(
                      Icons.send_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                    onPressed: _handleSend,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showModeSelector(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'SELECT MODE',
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _buildModeItem(
                    'CHAT MODE',
                    Icons.chat_bubble_outline_rounded,
                    !_isQuizMode,
                    () {
                      setState(() => _isQuizMode = false);
                      Navigator.pop(context);
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildModeItem(
                    'QUIZ MODE',
                    Icons.quiz_outlined,
                    _isQuizMode,
                    () {
                      Navigator.pop(context);
                      _showQuizForm(context, isDark);
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showQuizForm(BuildContext context, bool isDark) {
    final subjects = ref.read(subjectsProvider).asData?.value ?? [];
    if (subjects.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Loading subjects... please wait.')),
      );
      return;
    }

    String? selectedSubject = subjects.first.name;
    final topicController = TextEditingController();
    String selectedDifficulty = 'Medium';
    int selectedCount = 5;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            padding: EdgeInsets.fromLTRB(
              24,
              24,
              24,
              MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(30),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'QUIZ GENERATOR',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 24),
                _buildFormLabel('SELECT SUBJECT'),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: _formFieldDecoration(isDark),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: selectedSubject,
                      isExpanded: true,
                      dropdownColor: isDark
                          ? const Color(0xFF1E293B)
                          : Colors.white,
                      style: GoogleFonts.outfit(
                        color: isDark ? Colors.white : Colors.black,
                        fontWeight: FontWeight.w600,
                      ),
                      items: subjects
                          .map(
                            (s) => DropdownMenuItem(
                              value: s.name,
                              child: Text(s.name),
                            ),
                          )
                          .toList(),
                      onChanged: (val) =>
                          setModalState(() => selectedSubject = val),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _buildFormLabel('TOPIC / CHAPTER NAME'),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: _formFieldDecoration(isDark),
                  child: TextField(
                    controller: topicController,
                    style: GoogleFonts.outfit(
                      color: isDark ? Colors.white : Colors.black,
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: const InputDecoration(
                      hintText: 'e.g. Thermodynamics, Algebra...',
                      border: InputBorder.none,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildFormLabel('DIFFICULTY'),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: _formFieldDecoration(isDark),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: selectedDifficulty,
                                isExpanded: true,
                                dropdownColor: isDark
                                    ? const Color(0xFF1E293B)
                                    : Colors.white,
                                items: ['Easy', 'Medium', 'Hard']
                                    .map(
                                      (d) => DropdownMenuItem(
                                        value: d,
                                        child: Text(d),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (val) => setModalState(
                                  () => selectedDifficulty = val!,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildFormLabel('QUESTIONS'),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: _formFieldDecoration(isDark),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<int>(
                                value: selectedCount,
                                isExpanded: true,
                                dropdownColor: isDark
                                    ? const Color(0xFF1E293B)
                                    : Colors.white,
                                items: [5, 10, 15]
                                    .map(
                                      (c) => DropdownMenuItem(
                                        value: c,
                                        child: Text('$c Qs'),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (val) =>
                                    setModalState(() => selectedCount = val!),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    onPressed: () {
                      if (topicController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter a topic')),
                        );
                        return;
                      }
                      Navigator.pop(context);
                      setState(() => _isQuizMode = true);
                      final prompt =
                          'Generate a quiz for Subject: $selectedSubject, Topic: ${topicController.text}, Difficulty: $selectedDifficulty, Number of Questions: $selectedCount.';
                      _textController.text = prompt;
                      _handleSend();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    child: Text(
                      'START INTERACTIVE TEST',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildFormLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        label,
        style: GoogleFonts.outfit(
          fontSize: 10,
          fontWeight: FontWeight.w900,
          color: Colors.grey,
          letterSpacing: 1,
        ),
      ),
    );
  }

  BoxDecoration _formFieldDecoration(bool isDark) {
    return BoxDecoration(
      color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
      borderRadius: BorderRadius.circular(15),
      border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
    );
  }

  Widget _buildModeItem(
    String label,
    IconData icon,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withOpacity(0.1)
              : Colors.grey.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.transparent,
            width: 2,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? AppTheme.primaryColor : Colors.grey,
              size: 32,
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: isSelected ? AppTheme.primaryColor : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBody(
    String text,
    bool isDark,
    bool isAi,
    DateTime timestamp,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isAi
              ? (isDark ? const Color(0xFF1E293B) : Colors.white)
              : AppTheme.primaryColor,
          borderRadius: BorderRadius.circular(22),
          boxShadow: isDark
              ? []
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                  ),
                ],
        ),
        child: MarkdownBody(
          data: _processTextForMath(text),
          styleSheet: MarkdownStyleSheet(
            p: GoogleFonts.outfit(
              color: isAi
                  ? (isDark ? Colors.white : AppTheme.textHeadingColor)
                  : Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuizLauncher(QuizModel quiz) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.psychology_rounded,
                color: Colors.white,
                size: 24,
              ),
              const SizedBox(width: 12),
              Text(
                'TOPPERAI QUIZ ENGINE',
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.white70,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Ready to test your knowledge on ${quiz.topic}?',
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${quiz.questions.length} adaptive questions generated specifically for you.',
            style: GoogleFonts.outfit(
              fontSize: 13,
              color: Colors.white70,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 55,
            child: ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => QuizScreen(quiz: quiz)),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppTheme.primaryColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
                elevation: 0,
              ),
              child: Text(
                'START INTERACTIVE QUIZ',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn().scale(curve: Curves.elasticOut, duration: 800.ms);
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  String _processTextForMath(String text) {
    // Fix escaped LaTeX from AI (e.g. \( ... \) and \[ ... \])
    text = text.replaceAll(r'\(', r'$').replaceAll(r'\)', r'$');
    text = text.replaceAll(r'\[', r'$$').replaceAll(r'\]', r'$$');
    text = text.replaceAll(r'\\(', r'$').replaceAll(r'\\)', r'$');
    text = text.replaceAll(r'\\[', r'$$').replaceAll(r'\\]', r'$$');
    // Double-escaped LaTeX from some AI providers
    text = text.replaceAll(r'\\\(', r'$').replaceAll(r'\\\)', r'$');
    text = text.replaceAll(r'\\\[', r'$$').replaceAll(r'\\\]', r'$$');

    // Handle block math $$ ... $$
    text = text.replaceAllMapped(
      RegExp(r'\$\$(.*?)\$\$', dotAll: true),
      (m) => '<latex block="true">${m.group(1)}</latex>',
    );
    // Handle inline math $ ... $
    text = text.replaceAllMapped(
      RegExp(r'\$([^\$\n]+?)\$'),
      (m) => '<latex>${m.group(1)}</latex>',
    );
    return text;
  }
}

class LatexBuilder extends MarkdownElementBuilder {
  final TextStyle style;
  LatexBuilder({required this.style});

  @override
  Widget? visitElementAfter(md.Element element, TextStyle? preferredStyle) {
    final text = element.textContent;
    final isBlock = element.attributes['block'] == 'true';

    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: isBlock ? 8.0 : 0),
        child: Math.tex(
          text,
          textStyle: style.copyWith(
            fontSize: (style.fontSize ?? 14) + (isBlock ? 4 : 2),
            fontWeight: isBlock ? FontWeight.bold : style.fontWeight,
          ),
          mathStyle: isBlock ? MathStyle.display : MathStyle.text,
          onErrorFallback: (e) =>
              Text(isBlock ? '\$\$$text\$\$' : '\$$text\$', style: style),
        ),
      ),
    );
  }
}
