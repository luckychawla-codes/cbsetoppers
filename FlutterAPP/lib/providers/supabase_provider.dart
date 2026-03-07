import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/supabase_service.dart';
import '../models/subject_model.dart';
import 'auth_provider.dart';

final supabaseServiceProvider = Provider((ref) => SupabaseService());

final subjectsProvider = FutureProvider<List<SubjectModel>>((ref) async {
  final user = ref.watch(authProvider).value;
  if (user == null) return [];

  return ref
      .read(supabaseServiceProvider)
      .fetchSubjects(
        user.studentClass,
        targetStream: user.stream,
        exams: user.competitiveExams,
      );
});

final dailyQuoteProvider = FutureProvider<String>((ref) async {
  final user = ref.watch(authProvider).value;
  return ref.read(supabaseServiceProvider).fetchDailyQuote(user);
});
