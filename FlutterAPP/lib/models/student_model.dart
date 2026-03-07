// Removed unused freezed import

class StudentModel {
  final String id;
  final String name;
  final String studentId;
  final String email;
  final String dob;
  final String studentClass;
  final String? classId;
  final String? stream;
  final String? streamId;
  final String? phone;
  final String gender;
  final List<String> competitiveExams;
  final List<String> competitiveExamIds;
  final String board;
  final bool isVerified;
  final bool isOperator;

  StudentModel({
    required this.id,
    required this.name,
    required this.studentId,
    required this.email,
    required this.dob,
    required this.studentClass,
    this.classId,
    this.stream,
    this.streamId,
    this.phone,
    required this.gender,
    required this.competitiveExams,
    required this.competitiveExamIds,
    required this.board,
    required this.isVerified,
    this.isOperator = false,
  });

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    try {
      return StudentModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        studentId: json['student_id'] ?? '',
        email: json['email'] ?? '',
        dob: json['dob'] ?? '',
        studentClass: json['class'] ?? '',
        classId: json['class_id']?.toString(),
        stream: json['stream'],
        streamId: json['stream_id']?.toString(),
        phone: json['phone']?.toString(),
        gender: json['gender'] ?? '',
        competitiveExams: List<String>.from(json['competitive_exams'] ?? []),
        competitiveExamIds: List<String>.from(
          (json['competitive_exam_ids'] as List?)?.map((e) => e.toString()) ??
              [],
        ),
        board: json['board'] ?? 'CBSE',
        isVerified: json['is_verified'] ?? false,
        isOperator: json['is_operator'] ?? false,
      );
    } catch (e) {
      print('ERROR: StudentModel.fromJson failed: $e');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'student_id': studentId,
      'email': email,
      'dob': dob,
      'class': studentClass,
      'class_id': classId,
      'stream': stream,
      'stream_id': streamId,
      'phone': phone,
      'gender': gender,
      'competitive_exams': competitiveExams,
      'competitive_exam_ids': competitiveExamIds,
      'board': board,
      'is_verified': isVerified,
    };
  }
}
