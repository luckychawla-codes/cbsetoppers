import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import '../models/quiz_model.dart';

// ─── Color Palette ───────────────────────────────────────────────────────────
const _kPrimaryColor = PdfColor.fromInt(0xFF6C63FF); // TopperAI purple
const _kSecondaryColor = PdfColor.fromInt(0xFF00BCD4); // teal accent
const _kDarkText = PdfColor.fromInt(0xFF1A1A2E);
const _kLightGrey = PdfColor.fromInt(0xFFF7F8FA);
const _kBorderGrey = PdfColor.fromInt(0xFFE0E0E0);
const _kGreen = PdfColor.fromInt(0xFF4CAF50);
const _kRed = PdfColor.fromInt(0xFFF44336);
const _kWhite = PdfColors.white;

/// Converts LaTeX-style math `$...$` and `$$...$$` into plain readable text
/// since the `pdf` package does not support LaTeX rendering natively.
/// This keeps equations legible in PDF output.
String _mathToText(String input) {
  // Replace block math $$...$$
  input = input.replaceAllMapped(
    RegExp(r'\$\$(.*?)\$\$', dotAll: true),
    (m) => ' [${m.group(1)?.trim()}] ',
  );
  // Replace inline math $...$
  input = input.replaceAllMapped(
    RegExp(r'\$(.*?)\$'),
    (m) => ' ${m.group(1)?.trim()} ',
  );
  // Clean up escaped LaTeX brackets
  input = input
      .replaceAll(r'\(', '')
      .replaceAll(r'\)', '')
      .replaceAll(r'\[', '')
      .replaceAll(r'\]', '')
      .replaceAll(r'\\', '')
      // Common Greek letters that may not render in basic PDF fonts
      .replaceAll('\u03b1', 'alpha')
      .replaceAll('\u03b2', 'beta')
      .replaceAll('\u03b3', 'gamma')
      .replaceAll('\u03b4', 'delta')
      .replaceAll('\u03b5', 'epsilon')
      .replaceAll('\u03b8', 'theta')
      .replaceAll('\u03bb', 'lambda')
      .replaceAll('\u03bc', 'mu')
      .replaceAll('\u03c0', 'pi')
      .replaceAll('\u03c3', 'sigma')
      .replaceAll('\u03c9', 'omega')
      .replaceAll('\u0394', 'Delta')
      .replaceAll('\u03a3', 'Sigma')
      .replaceAll('\u03a9', 'Omega')
      // Math symbols
      .replaceAll('\u221e', 'infinity')
      .replaceAll('\u221a', 'sqrt')
      .replaceAll('\u2248', '~=')
      .replaceAll('\u2260', '!=')
      .replaceAll('\u2264', '<=')
      .replaceAll('\u2265', '>=')
      .replaceAll('\u00b2', '^2')
      .replaceAll('\u00b3', '^3')
      .replaceAll('\u00b0', ' degrees')
      .replaceAll('\u00d7', 'x')
      .replaceAll('\u00f7', '/')
      .replaceAll('\u00b1', '+/-')
      .replaceAll('\u2192', '->')
      .replaceAll('\u21d2', '=>')
      .replaceAll('\u2211', 'sum')
      .replaceAll('\u222b', 'integral')
      .replaceAll('\u2202', 'd')
      .replaceAll('\u2207', 'nabla');
  return input;
}

/// Strips markdown bold/italic markers for plain PDF text
String _stripMarkdown(String text) {
  return text
      .replaceAll(RegExp(r'\*\*(.+?)\*\*'), r'\1')
      .replaceAll(RegExp(r'\*(.+?)\*'), r'\1')
      .replaceAll(RegExp(r'__(.+?)__'), r'\1')
      .replaceAll(RegExp(r'_(.+?)_'), r'\1')
      .replaceAll(RegExp(r'#+\s*'), '')
      .replaceAll(RegExp(r'`(.+?)`'), r'\1')
      .replaceAll(RegExp(r'[-*]\s+'), '• ')
      .trim();
}

String _cleanText(String text) => _stripMarkdown(_mathToText(text));

class PdfHelper {
  // ── shared page decoration (square border) ────────────────────────────────
  static pw.BoxDecoration _pageBoxDecoration() => pw.BoxDecoration(
    border: pw.Border.all(color: _kPrimaryColor, width: 3),
    borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
  );

  // ── Load font ────────────────────────────────────────────────────────────
  static Future<pw.Font?> _loadFont() async {
    try {
      final data = await rootBundle.load('assets/fonts/Outfit-Regular.ttf');
      return pw.Font.ttf(data);
    } catch (_) {
      return null; // Fall back to built-in Helvetica
    }
  }

  // ── Logo bytes ────────────────────────────────────────────────────────────
  static Future<Uint8List?> _loadLogo() async {
    try {
      final data = await rootBundle.load('assets/logo.png');
      return data.buffer.asUint8List();
    } catch (e) {
      return null;
    }
  }

  // ── Header widget (app logo + name + divider) ─────────────────────────────
  static pw.Widget _buildHeader({
    required Uint8List? logoBytes,
    required String title,
    required String subtitle,
  }) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Row(
          children: [
            if (logoBytes != null)
              pw.Container(
                width: 52,
                height: 52,
                margin: const pw.EdgeInsets.only(right: 16),
                child: pw.Image(
                  pw.MemoryImage(logoBytes),
                  fit: pw.BoxFit.contain,
                ),
              ),
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  'CBSEToppers',
                  style: pw.TextStyle(
                    color: _kPrimaryColor,
                    fontWeight: pw.FontWeight.bold,
                    fontSize: 22,
                    letterSpacing: 1.5,
                  ),
                ),
                pw.Text(
                  'Powered by TopperAI',
                  style: const pw.TextStyle(
                    color: _kSecondaryColor,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
            pw.Spacer(),
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Text(
                  title,
                  style: pw.TextStyle(
                    color: _kDarkText,
                    fontWeight: pw.FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                pw.Text(
                  subtitle,
                  style: const pw.TextStyle(
                    color: PdfColors.grey600,
                    fontSize: 9,
                  ),
                ),
              ],
            ),
          ],
        ),
        pw.SizedBox(height: 10),
        pw.Divider(color: _kPrimaryColor, thickness: 2),
        pw.SizedBox(height: 6),
      ],
    );
  }

  // ── Footer widget ─────────────────────────────────────────────────────────
  static pw.Widget _buildFooter(pw.Context ctx, String fileName) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Divider(color: PdfColors.grey300, thickness: 0.5),
        pw.SizedBox(height: 4),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Expanded(
              child: pw.Text(
                '\u26a0 AI-Generated Report. May contain errors. Cross-verify before relying. CBSEToppers is not responsible for any inaccuracies.',
                style: const pw.TextStyle(
                  color: PdfColors.orange700,
                  fontSize: 6.5,
                ),
              ),
            ),
            pw.SizedBox(width: 8),
            pw.Text(
              'Page ${ctx.pageNumber} of ${ctx.pagesCount}',
              style: const pw.TextStyle(color: PdfColors.grey500, fontSize: 8),
            ),
          ],
        ),
        pw.SizedBox(height: 2),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              'Support: cbsetoppers@zohomail.in  |  (c) ${DateTime.now().year} CBSEToppers',
              style: const pw.TextStyle(color: PdfColors.grey500, fontSize: 7),
            ),
          ],
        ),
      ],
    );
  }

  // ── Page wrapper with border ──────────────────────────────────────────────
  static pw.Widget _wrapWithBorder(pw.Widget child) {
    return pw.Container(
      decoration: _pageBoxDecoration(),
      padding: const pw.EdgeInsets.all(24),
      child: child,
    );
  }

  // ── Save PDF to Downloads folder ──────────────────────────────────────────
  static Future<String> _savePdf(Uint8List bytes, String filename) async {
    Directory dir;
    try {
      // Try Downloads directory first
      if (Platform.isAndroid) {
        dir = Directory('/storage/emulated/0/Download');
        if (!dir.existsSync()) {
          dir =
              await getExternalStorageDirectory() ??
              await getApplicationDocumentsDirectory();
        }
      } else {
        dir = await getApplicationDocumentsDirectory();
      }
    } catch (_) {
      dir = await getApplicationDocumentsDirectory();
    }

    final file = File('${dir.path}/$filename');
    await file.writeAsBytes(bytes);
    return file.path;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. RESULT PDF — Professional tabular format
  // ════════════════════════════════════════════════════════════════════════════
  static Future<String> generateResultPdf({
    required String topic,
    required int score,
    required int total,
    required String analysis,
    String? studentName,
  }) async {
    final logoBytes = await _loadLogo();
    final pdf = pw.Document();
    final percent = ((score / total) * 100).toInt();
    final date = DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now());
    final grade = percent >= 90
        ? 'A+ (Excellent)'
        : percent >= 75
        ? 'A (Very Good)'
        : percent >= 60
        ? 'B (Good)'
        : percent >= 40
        ? 'C (Average)'
        : 'D (Needs Improvement)';

    // Parse analysis lines for table
    final analysisLines = analysis
        .split('\n')
        .map((l) => _cleanText(l))
        .where((l) => l.isNotEmpty)
        .toList();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(28),
        header: (ctx) => _buildHeader(
          logoBytes: logoBytes,
          title: 'QUIZ RESULT REPORT',
          subtitle: date,
        ),
        footer: (ctx) => _buildFooter(ctx, 'Quiz_Result_$topic.pdf'),
        build: (ctx) => [
          _wrapWithBorder(
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // ── Score Summary Banner ──────────────────────────────────
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.symmetric(
                    vertical: 20,
                    horizontal: 24,
                  ),
                  decoration: const pw.BoxDecoration(
                    color: _kPrimaryColor,
                    borderRadius: pw.BorderRadius.all(pw.Radius.circular(8)),
                  ),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            'QUIZ SCORE',
                            style: pw.TextStyle(
                              color: _kWhite,
                              fontWeight: pw.FontWeight.bold,
                              fontSize: 10,
                              letterSpacing: 2,
                            ),
                          ),
                          pw.SizedBox(height: 6),
                          pw.Text(
                            '$score / $total',
                            style: pw.TextStyle(
                              color: _kWhite,
                              fontWeight: pw.FontWeight.bold,
                              fontSize: 36,
                            ),
                          ),
                        ],
                      ),
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.end,
                        children: [
                          pw.Text(
                            '$percent%',
                            style: pw.TextStyle(
                              color: _kWhite,
                              fontWeight: pw.FontWeight.bold,
                              fontSize: 48,
                            ),
                          ),
                          pw.Text(
                            grade,
                            style: const pw.TextStyle(
                              color: PdfColors.white,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 20),

                // ── Info Table ────────────────────────────────────────────
                pw.Table(
                  border: pw.TableBorder.all(color: _kBorderGrey, width: 0.5),
                  columnWidths: {
                    0: const pw.FlexColumnWidth(1),
                    1: const pw.FlexColumnWidth(2),
                  },
                  children: [
                    _tableRow('Topic', _cleanText(topic), header: true),
                    _tableRow(
                      'Student',
                      studentName != null ? _cleanText(studentName) : 'N/A',
                    ),
                    _tableRow('Date', date),
                    _tableRow('Score', '$score out of $total'),
                    _tableRow('Percentage', '$percent%'),
                    _tableRow('Grade', grade),
                  ],
                ),
                pw.SizedBox(height: 24),

                // ── AI Analysis ───────────────────────────────────────────
                pw.Text(
                  'AI ANALYSIS & INSIGHTS',
                  style: pw.TextStyle(
                    color: _kPrimaryColor,
                    fontWeight: pw.FontWeight.bold,
                    fontSize: 13,
                    letterSpacing: 1.5,
                  ),
                ),
                pw.SizedBox(height: 8),
                pw.Divider(color: _kPrimaryColor, thickness: 1),
                pw.SizedBox(height: 10),

                ...analysisLines.map((line) {
                  final isBullet = line.startsWith('•') || line.startsWith('-');
                  return pw.Padding(
                    padding: const pw.EdgeInsets.only(bottom: 5),
                    child: isBullet
                        ? pw.Row(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Container(
                                width: 6,
                                height: 6,
                                margin: const pw.EdgeInsets.only(
                                  top: 5,
                                  right: 8,
                                ),
                                decoration: const pw.BoxDecoration(
                                  color: _kPrimaryColor,
                                  shape: pw.BoxShape.circle,
                                ),
                              ),
                              pw.Expanded(
                                child: pw.Text(
                                  line.replaceFirst(RegExp(r'^[•\-]\s*'), ''),
                                  style: const pw.TextStyle(
                                    fontSize: 10,
                                    color: _kDarkText,
                                  ),
                                ),
                              ),
                            ],
                          )
                        : pw.Text(
                            line,
                            style: const pw.TextStyle(
                              fontSize: 10,
                              color: _kDarkText,
                            ),
                          ),
                  );
                }).toList(),

                pw.SizedBox(height: 20),

                // ── Study Plan stub ───────────────────────────────────────
                _studyPlanBlock(topic, score, total),
              ],
            ),
          ),
        ],
      ),
    );

    final bytes = await pdf.save();
    final filename =
        'Result_${topic.replaceAll(' ', '_')}_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf';
    return _savePdf(bytes, filename);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 2. QUIZ + SOLUTIONS PDF
  // ════════════════════════════════════════════════════════════════════════════
  static Future<String> generateQuizPdf({
    required String topic,
    required List<Map<String, dynamic>> userAnswers,
    String? studentName,
  }) async {
    final logoBytes = await _loadLogo();
    final pdf = pw.Document();
    final date = DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now());

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(28),
        header: (ctx) => _buildHeader(
          logoBytes: logoBytes,
          title: 'QUIZ & SOLUTIONS',
          subtitle: '${_cleanText(topic)} — $date',
        ),
        footer: (ctx) => _buildFooter(ctx, 'Quiz_Solutions_$topic.pdf'),
        build: (ctx) => [
          _wrapWithBorder(
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // ── Questions Section ──────────────────────────────────────
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: const pw.BoxDecoration(
                    color: _kPrimaryColor,
                    borderRadius: pw.BorderRadius.all(pw.Radius.circular(6)),
                  ),
                  child: pw.Text(
                    'SECTION A — QUESTIONS',
                    style: pw.TextStyle(
                      color: _kWhite,
                      fontWeight: pw.FontWeight.bold,
                      fontSize: 12,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
                pw.SizedBox(height: 16),

                ...userAnswers.asMap().entries.map((entry) {
                  final i = entry.key;
                  final ans = entry.value;
                  final options = (ans['options'] as List? ?? []);
                  return pw.Container(
                    margin: const pw.EdgeInsets.only(bottom: 18),
                    padding: const pw.EdgeInsets.all(14),
                    decoration: pw.BoxDecoration(
                      color: _kLightGrey,
                      border: pw.Border.all(color: _kBorderGrey, width: 0.5),
                      borderRadius: const pw.BorderRadius.all(
                        pw.Radius.circular(6),
                      ),
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'Q${i + 1}. ${_cleanText(ans['question']?.toString() ?? '')}',
                          style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold,
                            fontSize: 11,
                            color: _kDarkText,
                          ),
                        ),
                        pw.SizedBox(height: 8),
                        pw.Table(
                          columnWidths: {
                            0: const pw.FlexColumnWidth(1),
                            1: const pw.FlexColumnWidth(1),
                          },
                          children: [
                            for (int o = 0; o < options.length; o += 2)
                              pw.TableRow(
                                children: [
                                  _optionCell(
                                    String.fromCharCode(65 + o),
                                    _cleanText(options[o].toString()),
                                  ),
                                  if (o + 1 < options.length)
                                    _optionCell(
                                      String.fromCharCode(66 + o),
                                      _cleanText(options[o + 1].toString()),
                                    )
                                  else
                                    pw.Container(),
                                ],
                              ),
                          ],
                        ),
                      ],
                    ),
                  );
                }).toList(),

                pw.SizedBox(height: 16),

                // ── Answers Section ───────────────────────────────────────
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: const pw.BoxDecoration(
                    color: _kGreen,
                    borderRadius: pw.BorderRadius.all(pw.Radius.circular(6)),
                  ),
                  child: pw.Text(
                    'SECTION B — ANSWER KEY & EXPLANATIONS',
                    style: pw.TextStyle(
                      color: _kWhite,
                      fontWeight: pw.FontWeight.bold,
                      fontSize: 12,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
                pw.SizedBox(height: 16),

                pw.Table(
                  border: pw.TableBorder.all(color: _kBorderGrey, width: 0.5),
                  columnWidths: {
                    0: const pw.FixedColumnWidth(28),
                    1: const pw.FlexColumnWidth(2),
                    2: const pw.FlexColumnWidth(1.5),
                    3: const pw.FlexColumnWidth(1.5),
                    4: const pw.FlexColumnWidth(3),
                  },
                  children: [
                    pw.TableRow(
                      decoration: const pw.BoxDecoration(color: _kPrimaryColor),
                      children: [
                        _thCell('#'),
                        _thCell('Question'),
                        _thCell('Your Answer'),
                        _thCell('Correct Answer'),
                        _thCell('Explanation'),
                      ],
                    ),
                    ...userAnswers.asMap().entries.map((entry) {
                      final i = entry.key;
                      final ans = entry.value;
                      final isCorrect = ans['correct'] == true;
                      return pw.TableRow(
                        decoration: pw.BoxDecoration(
                          color: isCorrect
                              ? PdfColor.fromInt(0xFFE8F5E9)
                              : PdfColor.fromInt(0xFFFFEBEE),
                        ),
                        children: [
                          _tdCell('${i + 1}'),
                          _tdCell(
                            _cleanText(ans['question']?.toString() ?? ''),
                          ),
                          _tdCell(
                            _cleanText(ans['selected']?.toString() ?? '-'),
                            color: isCorrect ? _kGreen : _kRed,
                          ),
                          _tdCell(
                            _cleanText(ans['actual']?.toString() ?? '-'),
                            color: _kGreen,
                          ),
                          _tdCell(
                            _cleanText(ans['explanation']?.toString() ?? ''),
                          ),
                        ],
                      );
                    }).toList(),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );

    final bytes = await pdf.save();
    final filename =
        'Quiz_${topic.replaceAll(' ', '_')}_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf';
    return _savePdf(bytes, filename);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. AI STUDY PLANNER PDF
  // ════════════════════════════════════════════════════════════════════════════
  static Future<String> generatePlannerPdf({
    required String topic,
    required String analysis,
    String? studentName,
    int? score,
    int? total,
  }) async {
    final logoBytes = await _loadLogo();
    final pdf = pw.Document();
    final date = DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now());

    // Parse analysis into sections
    final analysisLines = analysis
        .split('\n')
        .map((l) => _cleanText(l))
        .where((l) => l.isNotEmpty)
        .toList();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(28),
        header: (ctx) => _buildHeader(
          logoBytes: logoBytes,
          title: 'AI STUDY PLANNER',
          subtitle: date,
        ),
        footer: (ctx) => _buildFooter(ctx, 'Planner_$topic.pdf'),
        build: (ctx) => [
          _wrapWithBorder(
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Banner
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.all(18),
                  decoration: const pw.BoxDecoration(
                    color: _kSecondaryColor,
                    borderRadius: pw.BorderRadius.all(pw.Radius.circular(8)),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'PERSONALISED STUDY PLAN',
                        style: pw.TextStyle(
                          color: _kWhite,
                          fontWeight: pw.FontWeight.bold,
                          fontSize: 16,
                          letterSpacing: 2,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'Topic: ${_cleanText(topic)}',
                        style: const pw.TextStyle(
                          color: PdfColors.white,
                          fontSize: 11,
                        ),
                      ),
                      if (studentName != null)
                        pw.Text(
                          'Student: $studentName',
                          style: const pw.TextStyle(
                            color: PdfColors.white,
                            fontSize: 11,
                          ),
                        ),
                      if (score != null && total != null)
                        pw.Text(
                          'Based on Score: $score/$total (${((score / total) * 100).toInt()}%)',
                          style: const pw.TextStyle(
                            color: PdfColors.white,
                            fontSize: 11,
                          ),
                        ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 20),

                // 3-Day Plan Table
                pw.Text(
                  '3-DAY REVISION ROADMAP',
                  style: pw.TextStyle(
                    color: _kPrimaryColor,
                    fontWeight: pw.FontWeight.bold,
                    fontSize: 12,
                    letterSpacing: 1.5,
                  ),
                ),
                pw.SizedBox(height: 10),
                pw.Table(
                  border: pw.TableBorder.all(color: _kBorderGrey, width: 0.5),
                  columnWidths: {
                    0: const pw.FixedColumnWidth(60),
                    1: const pw.FlexColumnWidth(1),
                    2: const pw.FlexColumnWidth(2),
                  },
                  children: [
                    pw.TableRow(
                      decoration: const pw.BoxDecoration(color: _kPrimaryColor),
                      children: [
                        _thCell('Day'),
                        _thCell('Focus Area'),
                        _thCell('Activities'),
                      ],
                    ),
                    pw.TableRow(
                      decoration: const pw.BoxDecoration(color: _kLightGrey),
                      children: [
                        _tdCell('Day 1', color: _kPrimaryColor),
                        _tdCell('Theory Review'),
                        _tdCell(
                          'Read NCERT chapter on ${_cleanText(topic)}. Highlight key concepts & formulae. Make summary notes.',
                        ),
                      ],
                    ),
                    pw.TableRow(
                      children: [
                        _tdCell('Day 2', color: _kPrimaryColor),
                        _tdCell('Practice'),
                        _tdCell(
                          'Solve 20 numerical problems. Focus on weak areas identified in quiz. Practice previous year questions.',
                        ),
                      ],
                    ),
                    pw.TableRow(
                      decoration: const pw.BoxDecoration(color: _kLightGrey),
                      children: [
                        _tdCell('Day 3', color: _kPrimaryColor),
                        _tdCell('Mock Test & Review'),
                        _tdCell(
                          'Re-attempt the quiz. Compare with previous score. Revise remaining weak points.',
                        ),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 24),

                // AI Insights block
                pw.Text(
                  'AI INSIGHTS & RECOMMENDATIONS',
                  style: pw.TextStyle(
                    color: _kPrimaryColor,
                    fontWeight: pw.FontWeight.bold,
                    fontSize: 12,
                    letterSpacing: 1.5,
                  ),
                ),
                pw.SizedBox(height: 8),
                pw.Divider(color: _kPrimaryColor, thickness: 1),
                pw.SizedBox(height: 10),

                pw.Container(
                  padding: const pw.EdgeInsets.all(14),
                  decoration: pw.BoxDecoration(
                    color: _kLightGrey,
                    border: pw.Border.all(color: _kBorderGrey, width: 0.5),
                    borderRadius: const pw.BorderRadius.all(
                      pw.Radius.circular(6),
                    ),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: analysisLines.map((line) {
                      final isBullet =
                          line.startsWith('•') || line.startsWith('-');
                      return pw.Padding(
                        padding: const pw.EdgeInsets.only(bottom: 5),
                        child: isBullet
                            ? pw.Row(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Container(
                                    width: 5,
                                    height: 5,
                                    margin: const pw.EdgeInsets.only(
                                      top: 5,
                                      right: 8,
                                    ),
                                    decoration: const pw.BoxDecoration(
                                      color: _kSecondaryColor,
                                      shape: pw.BoxShape.circle,
                                    ),
                                  ),
                                  pw.Expanded(
                                    child: pw.Text(
                                      line.replaceFirst(
                                        RegExp(r'^[•\-]\s*'),
                                        '',
                                      ),
                                      style: const pw.TextStyle(
                                        fontSize: 10,
                                        color: _kDarkText,
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : pw.Text(
                                line,
                                style: const pw.TextStyle(
                                  fontSize: 10,
                                  color: _kDarkText,
                                ),
                              ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    final bytes = await pdf.save();
    final filename =
        'Planner_${topic.replaceAll(' ', '_')}_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf';
    return _savePdf(bytes, filename);
  }

  // ── Helper table cells ─────────────────────────────────────────────────────
  static pw.TableRow _tableRow(
    String key,
    String value, {
    bool header = false,
  }) {
    return pw.TableRow(
      decoration: header ? const pw.BoxDecoration(color: _kLightGrey) : null,
      children: [
        pw.Padding(
          padding: const pw.EdgeInsets.all(8),
          child: pw.Text(
            key,
            style: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              fontSize: 10,
              color: _kPrimaryColor,
            ),
          ),
        ),
        pw.Padding(
          padding: const pw.EdgeInsets.all(8),
          child: pw.Text(
            value,
            style: const pw.TextStyle(fontSize: 10, color: _kDarkText),
          ),
        ),
      ],
    );
  }

  static pw.Widget _thCell(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(6),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          color: _kWhite,
          fontWeight: pw.FontWeight.bold,
          fontSize: 9,
        ),
      ),
    );
  }

  static pw.Widget _tdCell(String text, {PdfColor? color}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(6),
      child: pw.Text(
        text,
        style: pw.TextStyle(fontSize: 9, color: color ?? _kDarkText),
      ),
    );
  }

  static pw.Widget _optionCell(String letter, String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(6),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Container(
            width: 18,
            height: 18,
            margin: const pw.EdgeInsets.only(right: 6),
            decoration: const pw.BoxDecoration(
              color: _kPrimaryColor,
              shape: pw.BoxShape.circle,
            ),
            child: pw.Center(
              child: pw.Text(
                letter,
                style: pw.TextStyle(
                  color: _kWhite,
                  fontSize: 8,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
          ),
          pw.Expanded(
            child: pw.Text(
              text,
              style: const pw.TextStyle(fontSize: 9, color: _kDarkText),
            ),
          ),
        ],
      ),
    );
  }

  // ── 3-Day study plan block (used in result PDF) ───────────────────────────
  static pw.Widget _studyPlanBlock(String topic, int score, int total) {
    final pct = ((score / total) * 100).toInt();
    return pw.Container(
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromInt(0xFFEDE7F6),
        border: pw.Border.all(color: _kPrimaryColor, width: 0.5),
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            'QUICK 3-DAY STUDY PLAN',
            style: pw.TextStyle(
              color: _kPrimaryColor,
              fontWeight: pw.FontWeight.bold,
              fontSize: 11,
              letterSpacing: 1.5,
            ),
          ),
          pw.SizedBox(height: 10),
          _planRow(
            'Day 1',
            'Theory: Re-read "${_cleanText(topic)}" from NCERT — mark all formulae.',
          ),
          _planRow(
            'Day 2',
            'Practice: Solve 15–20 problems on weak areas. Focus on ${pct < 60 ? "fundamentals" : "advanced problems"}.',
          ),
          _planRow(
            'Day 3',
            'Mock Test: Re-attempt a quiz on "${_cleanText(topic)}" & compare with today\'s score.',
          ),
        ],
      ),
    );
  }

  static pw.Widget _planRow(String day, String task) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 7),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Container(
            width: 44,
            padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: const pw.BoxDecoration(
              color: _kPrimaryColor,
              borderRadius: pw.BorderRadius.all(pw.Radius.circular(4)),
            ),
            child: pw.Center(
              child: pw.Text(
                day,
                style: pw.TextStyle(
                  color: _kWhite,
                  fontSize: 8,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
          ),
          pw.SizedBox(width: 8),
          pw.Expanded(
            child: pw.Text(
              task,
              style: const pw.TextStyle(fontSize: 9, color: _kDarkText),
            ),
          ),
        ],
      ),
    );
  }
}
