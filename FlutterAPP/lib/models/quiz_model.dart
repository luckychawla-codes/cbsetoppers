class QuizModel {
  final String topic;
  final List<QuizQuestion> questions;

  QuizModel({required this.topic, required this.questions});

  factory QuizModel.fromJson(Map<String, dynamic> json) {
    return QuizModel(
      topic: json['topic'] ?? 'General',
      questions: (json['questions'] as List)
          .map((q) => QuizQuestion.fromJson(q))
          .toList(),
    );
  }
}

class QuizQuestion {
  final String question;
  final List<String> options;
  final int correctIndex;
  final String explanation;

  QuizQuestion({
    required this.question,
    required this.options,
    required this.correctIndex,
    required this.explanation,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    return QuizQuestion(
      question: json['question'] ?? '',
      options: List<String>.from(json['options'] ?? []),
      correctIndex: json['correctIndex'] ?? 0,
      explanation: json['explanation'] ?? '',
    );
  }
}

class QuizResult {
  final String topic;
  final int score;
  final int total;
  final DateTime date;
  final String analysis;

  QuizResult({
    required this.topic,
    required this.score,
    required this.total,
    required this.date,
    required this.analysis,
  });

  Map<String, dynamic> toJson() {
    return {
      'topic': topic,
      'score': score,
      'total': total,
      'date': date.toIso8601String(),
      'analysis': analysis,
    };
  }

  factory QuizResult.fromJson(Map<String, dynamic> json) {
    return QuizResult(
      topic: json['topic'],
      score: json['score'],
      total: json['total'],
      date: DateTime.parse(json['date']),
      analysis: json['analysis'] ?? '',
    );
  }
}
