import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../providers/supabase_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/auth_provider.dart';

class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currentUser = ref.watch(authProvider).value;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _buildAppBar(context, isDark),
          SliverToBoxAdapter(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: ref.read(supabaseServiceProvider).fetchLeaderboard(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.only(top: 100),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

                final leaderboard = snapshot.data ?? [];
                if (leaderboard.isEmpty) {
                  return _buildEmptyState();
                }

                return Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 24,
                  ),
                  child: Column(
                    children: [
                      ...leaderboard.asMap().entries.map((entry) {
                        final index = entry.key;
                        final data = entry.value;
                        final isMe = currentUser?.id == data['student_id'];
                        return _buildLeaderboardTile(index, data, isMe, isDark);
                      }),
                      const SizedBox(height: 100),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, bool isDark) {
    return SliverAppBar(
      pinned: true,
      expandedHeight: 180,
      backgroundColor: Colors.transparent,
      elevation: 0,
      leading: IconButton(
        icon: Icon(
          Icons.arrow_back_ios_new_rounded,
          color: isDark ? Colors.white : Colors.black87,
        ),
        onPressed: () => Navigator.pop(context),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(40),
              bottomRight: Radius.circular(40),
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              const Text(
                '🏆',
                style: TextStyle(fontSize: 40),
              ).animate().scale(delay: 200.ms),
              const SizedBox(height: 8),
              Text(
                'HALL OF FAME',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 2,
                ),
              ),
              Text(
                'TOP PERFORMANCE LEADERS',
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Colors.white70,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLeaderboardTile(
    int index,
    Map<String, dynamic> data,
    bool isMe,
    bool isDark,
  ) {
    final rank = index + 1;
    final xp = data['xp'] as int;
    final name = data['name'] as String;

    Color? cardColor;
    Color? rankColor;
    Widget? rankWidget;

    if (rank == 1) {
      rankWidget = const Text('🥇', style: TextStyle(fontSize: 24));
      cardColor = Colors.amber.withOpacity(isDark ? 0.1 : 0.05);
      rankColor = Colors.amber;
    } else if (rank == 2) {
      rankWidget = const Text('🥈', style: TextStyle(fontSize: 24));
      cardColor = Colors.blueGrey.withOpacity(isDark ? 0.1 : 0.05);
      rankColor = Colors.blueGrey;
    } else if (rank == 3) {
      rankWidget = const Text('🥉', style: TextStyle(fontSize: 24));
      cardColor = Colors.brown.withOpacity(isDark ? 0.1 : 0.05);
      rankColor = Colors.brown;
    } else {
      rankWidget = Text(
        '#$rank',
        style: GoogleFonts.outfit(
          fontWeight: FontWeight.w900,
          color: isDark ? Colors.white24 : Colors.grey.shade300,
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isMe
            ? AppTheme.primaryColor.withOpacity(0.12)
            : (cardColor ??
                  (isDark ? Colors.white.withOpacity(0.02) : Colors.white)),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: isMe
              ? AppTheme.primaryColor.withOpacity(0.3)
              : (rankColor?.withOpacity(0.3) ??
                    (isDark ? Colors.white10 : Colors.grey.shade100)),
          width: isMe ? 2 : 1,
        ),
        boxShadow: isDark ? [] : AppTheme.premiumShadow,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 10,
        ),
        leading: Container(
          width: 45,
          height: 45,
          decoration: BoxDecoration(
            color: isDark ? Colors.black26 : Colors.white,
            shape: BoxShape.circle,
            boxShadow: isDark
                ? []
                : [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                    ),
                  ],
          ),
          child: Center(child: rankWidget),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                name.toUpperCase(),
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: isDark ? Colors.white : AppTheme.textHeadingColor,
                ),
              ),
            ),
            if (isMe)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'YOU',
                  style: GoogleFonts.outfit(
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
          ],
        ),
        subtitle: Text(
          'Learning Champion',
          style: GoogleFonts.outfit(
            fontSize: 11,
            color: Colors.grey,
            fontWeight: FontWeight.w600,
          ),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: isMe
                ? AppTheme.primaryColor
                : (isDark ? Colors.white10 : Colors.grey.shade50),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            '$xp XP',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w900,
              fontSize: 12,
              color: isMe ? Colors.white : AppTheme.primaryColor,
            ),
          ),
        ),
      ),
    ).animate().fadeIn(delay: (index * 100).ms).slideX(begin: 0.2);
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 100),
          Icon(
            Icons.military_tech_rounded,
            size: 80,
            color: Colors.grey.withOpacity(0.2),
          ),
          const SizedBox(height: 16),
          Text(
            'NO DATA YET',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w900,
              color: Colors.grey,
              fontSize: 14,
            ),
          ),
          const Text('Be the first to reach the top!'),
        ],
      ),
    );
  }
}
