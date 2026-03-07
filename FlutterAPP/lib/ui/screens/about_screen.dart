import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            color: isDark ? Colors.white : AppTheme.textHeadingColor,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'LEGAL & ABOUT',
          style: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : AppTheme.textHeadingColor,
            letterSpacing: 1.5,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Column(
          children: [
            _buildHero(isDark),
            const SizedBox(height: 32),
            _buildLegalSections(context, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildHero(bool isDark) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            borderRadius: BorderRadius.circular(30),
            boxShadow: isDark
                ? []
                : [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(30),
            child: Image.asset('assets/logo.png', fit: BoxFit.cover),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'CBSE TOPPERS',
          style: GoogleFonts.outfit(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : AppTheme.textHeadingColor,
            letterSpacing: -1,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Version 2.0.0 (2026 Edition)',
          style: GoogleFonts.outfit(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: AppTheme.primaryColor,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'CBSE TOPPERS IS A PREMIUM EDUCATIONAL PLATFORM DESIGNED TO EMPOWER STUDENTS WITH AI-DRIVEN LEARNING TOOLS, COMPETITIVE EXAM PREPARATION, AND REAL-TIME PERFORMANCE ANALYTICS. OUR MISSION IS TO DEMOCRATIZE HIGH-QUALITY EDUCATION THROUGH TECHNOLOGY.',
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.white70 : Colors.grey[700],
            height: 1.6,
          ),
        ),
      ],
    );
  }

  Widget _buildLegalSections(BuildContext context, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPolicySection(
          'Privacy Policy',
          'YOUR PRIVACY IS OUR TOP PRIORITY. WE COLLECT MINIMAL DATA (NAME, EMAIL, ACADEMIC GOALS) TO PERSONALIZE YOUR LEARNING EXPERIENCE. WE NEVER SELL YOUR DATA TO THIRD PARTIES. ALL DATA IS ENCRYPTED AND STORED SECURELY USING SUPABASE INFRASTRUCTURE.',
          isDark,
        ),
        const SizedBox(height: 16),
        _buildPolicySection(
          'Terms & Conditions',
          'BY USING CBSE TOPPERS, YOU AGREE TO USE THE PLATFORM FOR ACADEMIC PURPOSES ONLY. REDISTRIBUTION OF CONTENT, REVERSE ENGINEERING THE APP, OR HARASSMENT OF OTHER USERS IS STRICTLY PROHIBITED AND WILL RESULT IN ACCOUNT TERMINATION.',
          isDark,
        ),
        const SizedBox(height: 16),
        _buildPolicySection(
          'Refund Policy',
          'WE OFFER A 7-DAY NO-QUESTIONS-ASKED REFUND FOR ANY PREMIUM SUBSCRIPTIONS. AFTER 7 DAYS, REFUNDS ARE HANDLED ON A CASE-BY-CASE BASIS DEPENDING ON THE USAGE AND REASON FOR DISCONTINUATION.',
          isDark,
        ),
        const SizedBox(height: 16),
        _buildPolicySection(
          'Honor Code',
          'ACADEMIC INTEGRITY IS CORE TO OUR MISSION. USERS COMMIT TO SUBMITTING THEIR OWN WORK, NOT SHARING QUIZ ANSWERS, AND USING TOPPERAI AS A TUTOR RATHER THAN A CHEATING TOOL.',
          isDark,
        ),
        const SizedBox(height: 32),
        Center(
          child: TextButton.icon(
            onPressed: () => showLicensePage(
              context: context,
              applicationName: 'CBSE Toppers',
              applicationVersion: '2.0.0',
            ),
            icon: const Icon(Icons.code_rounded, size: 18),
            label: Text(
              'OPEN SOURCE LICENSES',
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
                color: AppTheme.primaryColor,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPolicySection(String title, String content, bool isDark) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.02) : Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: isDark ? Colors.white10 : Colors.transparent),
        boxShadow: isDark
            ? []
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
      ),
      child: Theme(
        data: ThemeData(
          brightness: isDark ? Brightness.dark : Brightness.light,
        ).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          iconColor: AppTheme.primaryColor,
          collapsedIconColor: Colors.grey,
          title: Text(
            title.toUpperCase(),
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppTheme.textHeadingColor,
              letterSpacing: 1,
            ),
          ),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
          children: [
            Text(
              content,
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white60 : Colors.grey[600],
                height: 1.5,
              ),
              textAlign: TextAlign.justify,
            ),
          ],
        ),
      ),
    );
  }
}
