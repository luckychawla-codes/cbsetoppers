import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:math_expressions/math_expressions.dart' as math_expr;
import '../../../models/quiz_model.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/supabase_provider.dart';
import '../../../providers/auth_provider.dart';
import 'quiz_analysis_screen.dart';

class QuizScreen extends ConsumerStatefulWidget {
  final QuizModel quiz;
  const QuizScreen({super.key, required this.quiz});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  int _currentIndex = 0;
  int _score = 0;
  int? _selectedIdx;
  bool _isAnswered = false;
  final List<Map<String, dynamic>> _userAnswers = [];

  bool _showCalculator = false;
  String _calcExpression = '';
  String _calcResult = '';
  // Draggable calculator position
  Offset _calcOffset = const Offset(20, 100);

  void _onCalcKeyPress(String val) {
    setState(() {
      if (val == 'C') {
        _calcExpression = '';
        _calcResult = '';
      } else if (val == '=') {
        try {
          math_expr.Parser p = math_expr.Parser();
          math_expr.Expression exp = p.parse(
            _calcExpression.replaceAll('×', '*').replaceAll('÷', '/'),
          );
          math_expr.ContextModel cm = math_expr.ContextModel();
          double eval = exp.evaluate(math_expr.EvaluationType.REAL, cm);
          _calcResult = eval.toStringAsFixed(
            eval.truncateToDouble() == eval ? 0 : 4,
          );
        } catch (e) {
          _calcResult = 'Error';
        }
      } else {
        _calcExpression += val;
      }
    });
  }

  void _submitAnswer(int index) {
    if (_isAnswered) return;

    setState(() {
      _selectedIdx = index;
      _isAnswered = true;
      if (index == widget.quiz.questions[_currentIndex].correctIndex) {
        _score++;
      }
      _userAnswers.add({
        'question': widget.quiz.questions[_currentIndex].question,
        'options': widget.quiz.questions[_currentIndex].options,
        'correct': index == widget.quiz.questions[_currentIndex].correctIndex,
        'selected': widget.quiz.questions[_currentIndex].options[index],
        'actual': widget
            .quiz
            .questions[_currentIndex]
            .options[widget.quiz.questions[_currentIndex].correctIndex],
        'explanation': widget.quiz.questions[_currentIndex].explanation,
      });
    });
  }

  void _nextQuestion() {
    if (_currentIndex < widget.quiz.questions.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedIdx = null;
        _isAnswered = false;
      });
    } else {
      _showResults();
    }
  }

  Future<void> _showResults() async {
    final student = ref.read(authProvider).value;

    // AI Analysis of performance
    final prompt =
        "COMMAND: Provide a COMPREHENSIVE QUIZ ANALYSIS for student ${student?.name}. "
        "TOPIC: ${widget.quiz.topic}. SCORE: $_score/${widget.quiz.questions.length}. "
        "USER ANSWERS: $_userAnswers. "
        "INSTRUCTIONS: "
        "1. Start with a bold motivational heading. "
        "2. Analyze PROFICIENCY in the topic. "
        "3. Identify 2-3 specific WEAK AREAS based on incorrect answers. "
        "4. Create a 3-DAY AI STUDY PLAN: Day 1 (Theory), Day 2 (Practice), Day 3 (Review). "
        "Use Markdown for all sections to make it look professional.";

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    String analysis = "Great effort! Keep practicing to master this topic.";
    try {
      final svc = ref.read(supabaseServiceProvider);
      analysis = await svc.chatWithAI(prompt, student: student);

      // Save to Supabase
      if (student != null) {
        await svc.saveQuizResult(
          studentId: student.id,
          topic: widget.quiz.topic,
          score: _score,
          total: widget.quiz.questions.length,
          analysis: analysis,
        );
      }
    } catch (_) {}

    if (mounted) Navigator.pop(context); // Pop loader

    final result = QuizResult(
      topic: widget.quiz.topic,
      score: _score,
      total: widget.quiz.questions.length,
      date: DateTime.now(),
      analysis: analysis,
    );

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) =>
              QuizAnalysisScreen(result: result, userAnswers: _userAnswers),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.quiz.questions[_currentIndex];
    final progress = (_currentIndex + 1) / widget.quiz.questions.length;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          widget.quiz.topic.toUpperCase(),
          style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 14),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.calculate_rounded,
              color: _showCalculator
                  ? AppTheme.primaryColor
                  : (isDark ? Colors.white : Colors.black87),
            ),
            onPressed: () {
              setState(() => _showCalculator = !_showCalculator);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              LinearProgressIndicator(
                value: progress,
                backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
                valueColor: const AlwaysStoppedAnimation(AppTheme.primaryColor),
                minHeight: 6,
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'QUESTION ${_currentIndex + 1} OF ${widget.quiz.questions.length}',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.primaryColor,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildMathText(
                        q.question,
                        style: GoogleFonts.outfit(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: isDark
                              ? Colors.white
                              : AppTheme.textHeadingColor,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 40),
                      ...List.generate(q.options.length, (index) {
                        final option = q.options[index];
                        return _buildOption(index, option, isDark);
                      }),
                    ],
                  ),
                ),
              ),
              if (_isAnswered)
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: _nextQuestion,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      child: Text(
                        _currentIndex == widget.quiz.questions.length - 1
                            ? 'FINISH QUIZ'
                            : 'NEXT QUESTION',
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                    ).animate().slideY(begin: 0.5),
                  ),
                ),
            ],
          ),
          if (_showCalculator) _buildCalculator(isDark),
        ],
      ),
    );
  }

  Widget _buildOption(int index, String text, bool isDark) {
    Color? borderColor;
    Color? bgColor;
    IconData? icon;

    if (_isAnswered) {
      if (index == widget.quiz.questions[_currentIndex].correctIndex) {
        borderColor = Colors.green;
        bgColor = Colors.green.withOpacity(0.1);
        icon = Icons.check_circle_rounded;
      } else if (index == _selectedIdx) {
        borderColor = Colors.red;
        bgColor = Colors.red.withOpacity(0.1);
        icon = Icons.cancel_rounded;
      }
    } else {
      borderColor = isDark ? Colors.white10 : Colors.grey.shade200;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () => _submitAnswer(index),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color:
                bgColor ??
                (isDark ? Colors.white.withOpacity(0.02) : Colors.white),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: borderColor ?? Colors.transparent,
              width: 2,
            ),
            boxShadow: isDark
                ? []
                : [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
          ),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : Colors.grey.shade100,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    String.fromCharCode(65 + index),
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      color: isDark ? Colors.white38 : Colors.grey,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildMathText(
                  text,
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : AppTheme.textHeadingColor,
                  ),
                ),
              ),
              if (icon != null) Icon(icon, color: borderColor),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: (index * 100).ms);
  }

  Widget _buildMathText(String text, {required TextStyle style}) {
    // Attempt standard math notation fixes from messy AI outputs
    text = text.replaceAll(r'\(', r'$').replaceAll(r'\)', r'$');
    text = text.replaceAll(r'\[', r'$$').replaceAll(r'\]', r'$$');
    text = text.replaceAll(r'\\(', r'$').replaceAll(r'\\)', r'$');
    text = text.replaceAll(r'\\[', r'$$').replaceAll(r'\\]', r'$$');

    // Handle Block Math first
    if (text.contains('\$\$')) {
      final blocks = text.split('\$\$');
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: blocks.asMap().entries.map((entry) {
          final idx = entry.key;
          final val = entry.value;
          if (val.trim().isEmpty) return const SizedBox.shrink();
          if (idx % 2 == 1) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Math.tex(
                  val.trim(),
                  mathStyle: MathStyle.display,
                  textStyle: style.copyWith(
                    fontSize: style.fontSize! + 4,
                    fontWeight: FontWeight.bold,
                  ),
                  onErrorFallback: (err) =>
                      Text('\$\$\n$val\n\$\$', style: style),
                ),
              ),
            );
          }
          return _buildMathText(
            val,
            style: style,
          ); // Recursively handle inline math
        }).toList(),
      );
    }

    final parts = text.split('\$');
    if (parts.length == 1) return Text(text, style: style);

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      children: parts.asMap().entries.map((entry) {
        final idx = entry.key;
        final val = entry.value;
        if (val.isEmpty) return const SizedBox.shrink();
        if (idx % 2 == 1) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Math.tex(
              val,
              mathStyle: MathStyle.text,
              textStyle: style.copyWith(fontSize: style.fontSize! + 2),
              onErrorFallback: (err) => Text('\$$val\$', style: style),
            ),
          );
        }
        return Text(val, style: style);
      }).toList(),
    );
  }

  Widget _buildCalculator(bool isDark) {
    final buttons = [
      '7',
      '8',
      '9',
      '÷',
      '4',
      '5',
      '6',
      '×',
      '1',
      '2',
      '3',
      '-',
      'C',
      '0',
      '=',
      '+',
    ];

    final screenSize = MediaQuery.of(context).size;
    const calcWidth = 260.0;
    const calcHeight = 340.0;

    return Positioned(
      left: _calcOffset.dx.clamp(0, screenSize.width - calcWidth),
      top: _calcOffset.dy.clamp(0, screenSize.height - calcHeight),
      child: GestureDetector(
        onPanUpdate: (details) {
          setState(() {
            _calcOffset = Offset(
              (_calcOffset.dx + details.delta.dx).clamp(
                0,
                screenSize.width - calcWidth,
              ),
              (_calcOffset.dy + details.delta.dy).clamp(
                0,
                screenSize.height - calcHeight,
              ),
            );
          });
        },
        child: Material(
          elevation: 8,
          borderRadius: BorderRadius.circular(20),
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          child: Container(
            width: calcWidth,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag handle
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Icon(
                      Icons.drag_indicator_rounded,
                      color: Colors.grey.withOpacity(0.5),
                      size: 18,
                    ),
                    Text(
                      'CALCULATOR',
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: Colors.grey,
                        letterSpacing: 2,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _showCalculator = false),
                      child: Icon(
                        Icons.close_rounded,
                        color: Colors.grey,
                        size: 18,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.black26 : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        _calcExpression.isEmpty ? '0' : _calcExpression,
                        style: GoogleFonts.firaCode(
                          fontSize: 16,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _calcResult,
                        style: GoogleFonts.firaCode(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: buttons.length,
                  itemBuilder: (context, index) {
                    final btn = buttons[index];
                    final isOperator = ['+', '-', '×', '÷', '='].contains(btn);
                    final isClear = btn == 'C';
                    return InkWell(
                      onTap: () => _onCalcKeyPress(btn),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        decoration: BoxDecoration(
                          color: isOperator
                              ? AppTheme.primaryColor
                              : isClear
                              ? Colors.redAccent.withOpacity(0.8)
                              : isDark
                              ? Colors.white10
                              : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            btn,
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isOperator || isClear
                                  ? Colors.white
                                  : (isDark ? Colors.white : Colors.black87),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ).animate().scale(curve: Curves.easeOutBack, duration: 300.ms),
      ),
    );
  }
}

class _ResultSheet extends StatelessWidget {
  final QuizResult result;
  const _ResultSheet({required this.result});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final percent = (result.score / result.total * 100).toInt();

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
      ),
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.emoji_events_rounded,
              color: AppTheme.primaryColor,
              size: 32,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'QUIZ COMPLETED!',
            style: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You scored $percent% in ${result.topic}',
            style: GoogleFonts.outfit(
              color: Colors.grey,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withOpacity(0.05)
                  : Colors.grey.shade50,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.psychology_rounded,
                      color: AppTheme.primaryColor,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'TOPPERAI ANALYSIS',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.primaryColor,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  result.analysis,
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    color: isDark ? Colors.white70 : Colors.black87,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Bottom sheet
                Navigator.pop(context); // Quiz screen
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: Text(
                'CLOSE & CONTINUE',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
