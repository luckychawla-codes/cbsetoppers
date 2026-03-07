import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/theme_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';

class HelpSupportScreen extends ConsumerWidget {
  const HelpSupportScreen({super.key});

  final String emailSupport = 'cbsetoppers@zohomail.in';
  final String tgChannel = 'https://t.me/CBSET0PPERS';
  final String tgGroup = 'https://t.me/CBSET0PPERS_XIITH';
  final String tgPhysics = 'https://t.me/TusharPatelPHYSICSNEET';

  final String founderName = 'LUCKY CHAWLA';
  final String founderRole = 'Founder & Developer';
  final String founderEmail = 'luckychawla@zohomail.in';
  final String founderTg = 'https://t.me/seniiiorr';
  final String founderUpi = 'luckychawla@naviaxis';

  final String ownerName = 'TARUN KUMAR';
  final String ownerRole = 'Co-Founder & Owner';
  final String ownerEmail = 'tarun.in@zohomail.in';
  final String ownerTg = 'https://t.me/tarun_kumar_in';
  final String ownerUpi = '9760810446@fam';

  final String ceoName = 'ABHISHEK PANI';
  final String ceoRole = 'CEO & CUSTOMER SERVICE';
  final String ceoEmail = 'abhisekpani479@gmail.com';
  final String ceoTg = 'https://t.me/war4ver';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
          'CUSTOMER SUPPORT',
          style: GoogleFonts.outfit(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : AppTheme.textHeadingColor,
            letterSpacing: 1.5,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          children: [
            _buildHeaderIcon(),
            const SizedBox(height: 24),
            Text(
              'HELP & FEEDBACK',
              style: GoogleFonts.outfit(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textHeadingColor,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "WE'RE HERE TO SOLVE YOUR PROBLEMS 24/7",
              style: GoogleFonts.outfit(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: AppTheme.primaryColor,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 40),
            const SizedBox(height: 40),
            _buildCommunitySection(context, isDark),
            const SizedBox(height: 40),
            _buildAdministrationSection(context, isDark),
            const SizedBox(height: 40),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderIcon() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: const Icon(
        Icons.support_agent_rounded,
        color: Colors.white,
        size: 40,
      ),
    );
  }

  Widget _buildCommunitySection(BuildContext context, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8.0, bottom: 16),
          child: Text(
            'JOIN OUR COMMUNITY',
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white38 : Colors.grey,
              letterSpacing: 2,
            ),
          ),
        ),
        Row(
          children: [
            Expanded(
              child: _buildCommunityButton(
                context,
                Icons.telegram_rounded,
                'TG CHANNEL',
                const Color(0xFF229ED9),
                tgChannel,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildCommunityButton(
                context,
                Icons.groups_rounded,
                'MAIN GROUP',
                const Color(0xFF0088CC),
                tgGroup,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildPhysicsSupportCard(context, isDark),
      ],
    );
  }

  Widget _buildPhysicsSupportCard(BuildContext context, bool isDark) {
    return InkWell(
      onTap: () => _launchUrl(context, tgPhysics),
      borderRadius: BorderRadius.circular(25),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark
              ? Colors.white.withOpacity(0.05)
              : Colors.deepPurple.withOpacity(0.05),
          borderRadius: BorderRadius.circular(25),
          border: Border.all(
            color: isDark ? Colors.white10 : Colors.deepPurple.withOpacity(0.1),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(15),
              child: Image.asset(
                'assets/physics_group.png',
                width: 60,
                height: 60,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PHYSICS SUPPORT',
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: Colors.deepPurple,
                    ),
                  ),
                  Text(
                    'JEE/NEET Physics by Tushar Patel',
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : Colors.grey[700],
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.deepPurple),
          ],
        ),
      ),
    );
  }

  Widget _buildCommunityButton(
    BuildContext context,
    IconData icon,
    String label,
    Color color,
    String url,
  ) {
    return InkWell(
      onTap: () => _launchUrl(context, url),
      borderRadius: BorderRadius.circular(30),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: color.withOpacity(0.1)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: color.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: color,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdministrationSection(BuildContext context, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8.0, bottom: 16),
          child: Text(
            'ADMINISTRATION TEAM',
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white38 : Colors.grey,
              letterSpacing: 2,
            ),
          ),
        ),
        _buildAdminCard(
          context,
          ownerName,
          ownerRole,
          ownerEmail,
          ownerTg,
          ownerUpi,
          'assets/owner.png',
          Colors.indigo,
          isDark,
        ),
        const SizedBox(height: 16),
        _buildAdminCard(
          context,
          founderName,
          founderRole,
          founderEmail,
          founderTg,
          founderUpi,
          'assets/founder.png',
          AppTheme.primaryColor,
          isDark,
        ),
        const SizedBox(height: 16),
        _buildAdminCardNoCoffee(
          context,
          ceoName,
          ceoRole,
          ceoEmail,
          ceoTg,
          'assets/abhishek.png',
          AppTheme.accentColor,
          isDark,
        ),
      ],
    );
  }

  Widget _buildAdminCard(
    BuildContext context,
    String name,
    String role,
    String email,
    String tgUrl,
    String upiId,
    String assetPath,
    Color themeColor,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.02) : Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.withOpacity(0.1),
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
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: Image.asset(
                  assetPath,
                  width: 60,
                  height: 60,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: isDark
                            ? Colors.white
                            : AppTheme.textHeadingColor,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      role,
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: themeColor,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildSmallIconButton(
                  context,
                  Icons.mail_outline_rounded,
                  'EMAIL',
                  () => _launchMail(context, email),
                  isDark,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildSmallIconButton(
                  context,
                  Icons.send_rounded,
                  'TELEGRAM',
                  () => _launchUrl(context, tgUrl),
                  isDark,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildCoffeeButton(
                  context,
                  upiId,
                  name,
                  themeColor,
                  isDark,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Admin card without the coffee button (for CEO)
  Widget _buildAdminCardNoCoffee(
    BuildContext context,
    String name,
    String role,
    String email,
    String tgUrl,
    String assetPath,
    Color themeColor,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.02) : Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.withOpacity(0.1),
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
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: Image.asset(
                  assetPath,
                  width: 60,
                  height: 60,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: isDark
                            ? Colors.white
                            : AppTheme.textHeadingColor,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      role,
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: themeColor,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildSmallIconButton(
                  context,
                  Icons.mail_outline_rounded,
                  'EMAIL',
                  () => _launchMail(context, email),
                  isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSmallIconButton(
                  context,
                  Icons.send_rounded,
                  'TELEGRAM',
                  () => _launchUrl(context, tgUrl),
                  isDark,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCoffeeButton(
    BuildContext context,
    String upiId,
    String recipientName,
    Color themeColor,
    bool isDark,
  ) {
    return InkWell(
      onTap: () => _showCoffeeBottomSheet(
        context,
        upiId,
        recipientName,
        themeColor,
        isDark,
      ),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFFFDD57).withOpacity(0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFFDD57).withOpacity(0.4)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('☕', style: TextStyle(fontSize: 12)),
            const SizedBox(width: 4),
            Text(
              'COFFEE',
              style: GoogleFonts.outfit(
                fontSize: 8,
                fontWeight: FontWeight.w900,
                color: const Color(0xFF8B6914),
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCoffeeBottomSheet(
    BuildContext context,
    String upiId,
    String recipientName,
    Color themeColor,
    bool isDark,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _CoffeeBottomSheet(
        upiId: upiId,
        recipientName: recipientName,
        themeColor: themeColor,
        isDark: isDark,
        onLaunchUrl: (url) => _launchUrl(context, url),
      ),
    );
  }

  Widget _buildSmallIconButton(
    BuildContext context,
    IconData icon,
    String label,
    VoidCallback onTap,
    bool isDark,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isDark
              ? Colors.white.withOpacity(0.05)
              : Colors.grey.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 14,
              color: isDark ? Colors.white70 : Colors.grey[700],
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 9,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white70 : Colors.grey[700],
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Column(
      children: [
        Text(
          'Legal Queries: Tarun Kumar (Owner)',
          style: GoogleFonts.outfit(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            color: Colors.grey.withOpacity(0.5),
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Tech Issues: Lucky Chawla (Founder)',
          style: GoogleFonts.outfit(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            color: Colors.grey.withOpacity(0.5),
            letterSpacing: 1,
          ),
        ),
      ],
    );
  }

  Future<void> _launchUrl(BuildContext context, String url) async {
    try {
      final uri = Uri.parse(url);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Could not open link. Please install Telegram or check your connection.',
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _launchMail(BuildContext context, String email) async {
    try {
      final uri = Uri.parse('mailto:$email');
      if (!await launchUrl(uri)) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open your Mail app.')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }
}

// ── Buy Me a Coffee Bottom Sheet ─────────────────────────────────────────────
class _CoffeeBottomSheet extends StatefulWidget {
  final String upiId;
  final String recipientName;
  final Color themeColor;
  final bool isDark;
  final Future<void> Function(String url) onLaunchUrl;

  const _CoffeeBottomSheet({
    required this.upiId,
    required this.recipientName,
    required this.themeColor,
    required this.isDark,
    required this.onLaunchUrl,
  });

  @override
  State<_CoffeeBottomSheet> createState() => _CoffeeBottomSheetState();
}

class _CoffeeBottomSheetState extends State<_CoffeeBottomSheet> {
  int? _selectedAmount;

  final List<Map<String, dynamic>> _amounts = [
    {'amount': 25, 'emoji': '☕', 'label': 'Chai'},
    {'amount': 50, 'emoji': '☕☕', 'label': 'Coffee'},
    {'amount': 75, 'emoji': '🍵', 'label': 'Latte'},
    {'amount': 100, 'emoji': '🎉', 'label': 'Party'},
  ];

  void _payWithUpi(int amount) async {
    final firstName = widget.recipientName.split(' ')[0].toLowerCase();
    final upiUrl =
        'upi://pay?pa=${widget.upiId}&pn=${Uri.encodeComponent(widget.recipientName)}'
        '&am=$amount&cu=INR&tn=${Uri.encodeComponent('Buy $firstName a coffee ☕')}';

    // Try direct UPI intent
    try {
      final uri = Uri.parse(upiUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    } catch (_) {}

    // Fallback to Google Pay
    try {
      final gpayUrl =
          'tez://upi/pay?pa=${widget.upiId}&pn=${Uri.encodeComponent(widget.recipientName)}'
          '&am=$amount&cu=INR&tn=${Uri.encodeComponent('Buy a coffee')}';
      final uri = Uri.parse(gpayUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    } catch (_) {}

    // Fallback: PhonePe
    try {
      final ppUrl =
          'phonepe://pay?pa=${widget.upiId}&pn=${Uri.encodeComponent(widget.recipientName)}'
          '&am=$amount&cu=INR';
      final uri = Uri.parse(ppUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    } catch (_) {}

    // Last resort — show UPI ID so user can copy it
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'No UPI app found. Please pay ₹$amount to: ${widget.upiId}',
          ),
          duration: const Duration(seconds: 6),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),

          // Coffee emoji + title
          const Text('☕', style: TextStyle(fontSize: 48)),
          const SizedBox(height: 12),
          Text(
            'BUY ME A COFFEE',
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppTheme.textHeadingColor,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Support ${widget.recipientName.split(' ')[0]} for building\nCBSE Toppers with ❤️',
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white60 : Colors.grey[600],
              height: 1.4,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: widget.themeColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'UPI: ${widget.upiId}',
              style: GoogleFonts.outfit(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: widget.themeColor,
                letterSpacing: 0.5,
              ),
            ),
          ),

          const SizedBox(height: 28),

          // Amount grid
          Text(
            'SELECT AMOUNT',
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white38 : Colors.grey,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),

          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.2,
            children: _amounts.map((item) {
              final amount = item['amount'] as int;
              final isSelected = _selectedAmount == amount;
              return GestureDetector(
                onTap: () {
                  setState(() => _selectedAmount = amount);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? widget.themeColor
                        : (isDark
                              ? Colors.white.withOpacity(0.05)
                              : Colors.grey.shade50),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isSelected
                          ? widget.themeColor
                          : (isDark ? Colors.white10 : Colors.grey.shade200),
                      width: 2,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: widget.themeColor.withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : [],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        item['emoji'] as String,
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '₹$amount',
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: isSelected
                                  ? Colors.white
                                  : (isDark
                                        ? Colors.white
                                        : AppTheme.textHeadingColor),
                            ),
                          ),
                          Text(
                            item['label'] as String,
                            style: GoogleFonts.outfit(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: isSelected ? Colors.white70 : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 24),

          // Pay button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _selectedAmount == null
                  ? null
                  : () {
                      Navigator.pop(context);
                      _payWithUpi(_selectedAmount!);
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.themeColor,
                disabledBackgroundColor: Colors.grey.shade300,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('☕', style: TextStyle(fontSize: 20)),
                  const SizedBox(width: 10),
                  Text(
                    _selectedAmount == null
                        ? 'SELECT AN AMOUNT'
                        : 'PAY ₹$_selectedAmount VIA UPI',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      fontSize: 14,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),
          Text(
            'You will be redirected to your UPI app',
            style: GoogleFonts.outfit(
              fontSize: 10,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
