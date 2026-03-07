import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/quiz_model.dart';
import '../../../providers/supabase_provider.dart';
import '../../../providers/auth_provider.dart';
import 'package:intl/intl.dart';
import '../../services/pdf_helper.dart';
import '../../core/constants/app_constants.dart';
import 'package:open_filex/open_filex.dart';

class QuizAnalysisScreen extends ConsumerWidget {
  final QuizResult result;
  final List<Map<String, dynamic>> userAnswers;

  const QuizAnalysisScreen({
    super.key,
    required this.result,
    required this.userAnswers,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final student = ref.watch(authProvider).value;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          'DETAILED ANALYSIS',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 14),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildScoreOverview(isDark),
            const SizedBox(height: 32),
            _buildPerformanceGraph(ref, student?.id, isDark),
            const SizedBox(height: 32),
            _buildAnalysisContent(isDark),
            const SizedBox(height: 12),
            _buildDisclaimer(isDark),
            const SizedBox(height: 32),
            _buildReviewList(isDark),
            const SizedBox(height: 48),
            _buildStudyPlanSection(isDark),
            const SizedBox(height: 32),
            _buildDownloadOptions(isDark, student?.name),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreOverview(bool isDark) {
    final percent = (result.score / result.total * 100).toInt();
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(40),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 100,
                height: 100,
                child: CircularProgressIndicator(
                  value: percent / 100,
                  strokeWidth: 12,
                  backgroundColor: Colors.white24,
                  valueColor: const AlwaysStoppedAnimation(Colors.white),
                ),
              ),
              Text(
                '$percent%',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(width: 32),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.topic.toUpperCase(),
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: Colors.white70,
                    letterSpacing: 2,
                  ),
                ),
                Text(
                  'Score: ${result.score}/${result.total}',
                  style: GoogleFonts.outfit(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
                Text(
                  percent >= 80
                      ? 'EXCELLENT!'
                      : (percent >= 50 ? 'GOOD JOB!' : 'KEEP PUSHING!'),
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceGraph(WidgetRef ref, String? studentId, bool isDark) {
    if (studentId == null) return const SizedBox.shrink();

    return FutureBuilder<List<Map<String, dynamic>>>(
      future: ref.read(supabaseServiceProvider).fetchQuizHistory(studentId),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty)
          return const SizedBox.shrink();

        final history = snapshot.data!.reversed.toList(); // Longest ago first
        if (history.length < 2) return const SizedBox.shrink();

        final spots = history.asMap().entries.map((e) {
          final val =
              (e.value['score'] as num) /
              (e.value['total_questions'] as num) *
              100;
          return FlSpot(e.key.toDouble(), val.toDouble());
        }).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'PERFORMANCE TREND',
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white38 : Colors.grey,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 24),
            Container(
              height: 180,
              padding: const EdgeInsets.only(right: 20),
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: FlTitlesData(
                    show: true,
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 30,
                        getTitlesWidget: (val, _) => Text(
                          '${val.toInt()}%',
                          style: const TextStyle(
                            fontSize: 8,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      color: AppTheme.primaryColor,
                      barWidth: 4,
                      isStrokeCapRound: true,
                      dotData: const FlDotData(show: true),
                      belowBarData: BarAreaData(
                        show: true,
                        color: AppTheme.primaryColor.withOpacity(0.1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildAnalysisContent(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'AI INSIGHTS',
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white38 : Colors.grey,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.02) : Colors.white,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: isDark ? Colors.white10 : Colors.grey.shade100,
            ),
          ),
          child: MarkdownBody(
            data: result.analysis,
            styleSheet: MarkdownStyleSheet(
              p: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white70 : Colors.black87,
                height: 1.6,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewList(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'DETAILED REVIEW',
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white38 : Colors.grey,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 16),
        ...userAnswers.map((ans) => _buildAnswerTile(ans, isDark)),
      ],
    );
  }

  Widget _buildAnswerTile(Map<String, dynamic> ans, bool isDark) {
    final bool isCorrect = ans['correct'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.02) : Colors.white,
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: isCorrect
              ? Colors.green.withOpacity(0.2)
              : Colors.red.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isCorrect ? Icons.check_circle_rounded : Icons.cancel_rounded,
                color: isCorrect ? Colors.green : Colors.red,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  ans['question'],
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : AppTheme.textHeadingColor,
                  ),
                ),
              ),
            ],
          ),
          if (!isCorrect) ...[
            const SizedBox(height: 12),
            Text(
              'Your Answer: ${ans['selected']}',
              style: const TextStyle(fontSize: 12, color: Colors.red),
            ),
            Text(
              'Correct: ${ans['actual']}',
              style: const TextStyle(fontSize: 12, color: Colors.green),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            ans['explanation'] ?? '',
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontStyle: FontStyle.italic,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudyPlanSection(bool isDark) {
    // This could also be a separate AI call, but for now we'll use a placeholder or part of the analysis
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: AppTheme.secondaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(40),
            border: Border.all(color: AppTheme.secondaryColor.withOpacity(0.2)),
          ),
          child: Column(
            children: [
              const Icon(
                Icons.auto_stories_rounded,
                color: AppTheme.secondaryColor,
                size: 40,
              ),
              const SizedBox(height: 16),
              Text(
                'AI STUDY PLANNER',
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.secondaryColor,
                  letterSpacing: 3,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'BASED ON YOUR SCORE, WE RECOMMEND FOCUSING ON THESE CONCEPTS FOR THE NEXT 3 DAYS.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.secondaryColor.withOpacity(0.8),
                ),
              ),
              const SizedBox(height: 24),
              _buildPlanItem(
                'Day 1: Theory Review of $topicName',
                AppTheme.secondaryColor,
              ),
              _buildPlanItem(
                'Day 2: Practice Numerical Examples',
                AppTheme.secondaryColor,
              ),
              _buildPlanItem(
                'Day 3: Attempt Mock Test Again',
                AppTheme.secondaryColor,
              ),
            ],
          ),
        ),
      ],
    );
  }

  String get topicName => result.topic;

  Widget _buildDownloadOptions(bool isDark, String? studentName) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'DOWNLOAD OPTIONS',
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white38 : Colors.grey,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 16),
        _buildDownloadButton(
          'RESULT PDF',
          'Download your performance summary',
          Icons.picture_as_pdf_rounded,
          () async {
            final path = await PdfHelper.generateResultPdf(
              topic: result.topic,
              score: result.score,
              total: result.total,
              analysis: result.analysis,
              studentName: studentName,
            );
            await OpenFilex.open(path);
          },
          Colors.orange,
          isDark,
        ),
        const SizedBox(height: 12),
        _buildDownloadButton(
          'QUIZ & SOLUTIONS',
          'Detailed question-wise review',
          Icons.quiz_rounded,
          () async {
            final path = await PdfHelper.generateQuizPdf(
              topic: result.topic,
              userAnswers: userAnswers,
              studentName: studentName,
            );
            await OpenFilex.open(path);
          },
          Colors.blue,
          isDark,
        ),
        const SizedBox(height: 12),
        _buildDownloadButton(
          'AI STUDY PLANNER',
          'Suggested revision roadmap',
          Icons.auto_stories_rounded,
          () async {
            final path = await PdfHelper.generatePlannerPdf(
              topic: result.topic,
              analysis: result.analysis,
              studentName: studentName,
              score: result.score,
              total: result.total,
            );
            await OpenFilex.open(path);
          },
          Colors.green,
          isDark,
        ),
      ],
    );
  }

  Widget _buildDownloadButton(
    String title,
    String subtitle,
    IconData icon,
    Future<void> Function() onTap,
    Color color,
    bool isDark,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(15),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: color,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : Colors.grey[700],
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.download_rounded, color: color, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanItem(String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        children: [
          Icon(Icons.bolt_rounded, size: 14, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDisclaimer(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        AppConstants.aiDisclaimer,
        style: GoogleFonts.outfit(
          fontSize: 9,
          color: Colors.grey,
          fontWeight: FontWeight.w500,
          fontStyle: FontStyle.italic,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
