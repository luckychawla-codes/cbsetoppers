import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:country_code_picker/country_code_picker.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/supabase_provider.dart';
import '../../core/theme/app_theme.dart';
import 'home_screen.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final PageController _pageController = PageController();
  final _formKey0 = GlobalKey<FormState>();
  final _formKey1 = GlobalKey<FormState>();
  final _formKey2 = GlobalKey<FormState>();

  // Controllers
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _dobController = TextEditingController();
  final _phoneController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  String? _selectedClass;
  String? _selectedStream;
  String? _selectedGender; // NEW: Gender selection
  String _countryCode = '+91'; // NEW: Country code, default India
  String _countryFlag = '🇮🇳'; // NEW: Country flag emoji
  List<String> _selectedExams = [];

  // Loaded from Supabase
  List<String> _streams = [];
  List<String> _examsList = [];
  List<String> _classes = [];
  bool _loadingOptions = true;

  int _currentPage = 0;
  final int _totalPages = 3;

  @override
  void initState() {
    super.initState();
    _loadOptions();
  }

  Future<void> _loadOptions() async {
    try {
      final svc = ref.read(supabaseServiceProvider);
      final results = await Future.wait([
        svc.fetchStreams(),
        svc.fetchCompetitiveExams(),
        svc.fetchClasses(),
      ]);
      if (mounted) {
        setState(() {
          _streams = results[0];
          _examsList = results[1];
          _classes = results[2];
          if (_classes.isNotEmpty) {
            _selectedClass = _classes.first;
          }
          _loadingOptions = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingOptions = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not load options: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  bool get _needsStream {
    if (_selectedClass == null) return false;
    final c = _selectedClass!.toUpperCase();
    return c.contains('XI') || c.contains('DROPPER');
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 16, now.month, now.day),
      firstDate: DateTime(1990),
      lastDate: DateTime(now.year - 5),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primaryColor,
              onPrimary: Colors.white,
              onSurface: AppTheme.textHeadingColor,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      _dobController.text =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    }
  }

  void _nextPage() {
    bool isValid = false;
    if (_currentPage == 0) {
      isValid = _formKey0.currentState?.validate() ?? false;
      // Additional check for gender
      if (isValid && _selectedGender == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select your gender'),
            backgroundColor: Colors.redAccent,
          ),
        );
        return;
      }
    } else if (_currentPage == 1) {
      isValid = _formKey1.currentState?.validate() ?? false;
    } else if (_currentPage == 2) {
      isValid = _formKey2.currentState?.validate() ?? false;
      if (isValid) _register();
      return;
    }

    if (isValid) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  void _previousPage() {
    _pageController.previousPage(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
    );
  }

  Future<void> _register() async {
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Passwords do not match!'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    // Build the full phone number with country code
    final phoneRaw = _phoneController.text.trim();
    final fullPhone = phoneRaw.isEmpty ? null : '$_countryCode$phoneRaw';

    try {
      await ref
          .read(authProvider.notifier)
          .register(
            name: _nameController.text.trim(),
            dob: _dobController.text,
            studentClass: _selectedClass!,
            stream: _needsStream ? _selectedStream : 'Science',
            email: _emailController.text.trim(),
            phone: fullPhone,
            password: _passwordController.text,
            competitiveExams: _selectedExams,
            gender: _selectedGender ?? 'OTHER',
          );

      final authState = ref.read(authProvider);
      if (authState.hasValue && authState.value != null) {
        if (!mounted) return;
        final sid = authState.value!.studentId;
        await showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(30),
            ),
            title: Text(
              '🎉 Welcome aboard!',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontWeight: FontWeight.w900),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Your Student ID covers your personality:'),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.primaryColor.withOpacity(0.1),
                        AppTheme.secondaryColor.withOpacity(0.1),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppTheme.primaryColor.withOpacity(0.2),
                    ),
                  ),
                  child: Text(
                    sid,
                    style: GoogleFonts.outfit(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.primaryColor,
                      letterSpacing: 4,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Keep it safe! You\'ll use this to log in.',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const HomeScreen()),
                  );
                },
                child: Text(
                  'TAKE ME HOME',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w900,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Registration failed: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider) is AsyncLoading;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_loadingOptions) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: AppTheme.primaryColor),
              const SizedBox(height: 24),
              Text(
                'Preparing your journey...',
                style: GoogleFonts.outfit(
                  color: Colors.grey,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Container(
        height: double.infinity,
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              _buildProgressBar(),
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (page) => setState(() => _currentPage = page),
                  children: [
                    _buildStep(
                      formKey: _formKey0,
                      title: 'The basics',
                      subtitle: 'Tell us a bit about yourself',
                      children: [
                        _buildField(
                          'Full Name',
                          _nameController,
                          Icons.person_outline,
                          hint: 'Enter your name',
                        ),
                        const SizedBox(height: 24),
                        _buildDateField(),
                        const SizedBox(height: 24),
                        _buildGenderSelector(),
                        const SizedBox(height: 24),
                        _buildPhoneField(),
                      ],
                    ),
                    _buildStep(
                      formKey: _formKey1,
                      title: 'Your goals',
                      subtitle: 'Help us tailor the content for you',
                      children: [
                        _buildDropdown(
                          'Class / Grade',
                          _selectedClass,
                          _classes,
                          Icons.school_outlined,
                          (val) => setState(() {
                            _selectedClass = val;
                            _selectedStream = null;
                          }),
                        ),
                        if (_needsStream) ...[
                          const SizedBox(height: 24),
                          _buildDropdown(
                            'Stream / Branch',
                            _selectedStream,
                            (_streams.isEmpty
                                    ? ['PCB', 'PCM', 'PCBM', 'Commerce', 'Arts']
                                    : _streams)
                                .where((s) => s.toLowerCase() != 'science')
                                .toList(),
                            Icons.science_outlined,
                            (val) => setState(() => _selectedStream = val),
                            required: true,
                          ),
                        ],
                        const SizedBox(height: 32),
                        _buildExamsChipGroup(),
                      ],
                    ),
                    _buildStep(
                      formKey: _formKey2,
                      title: 'Finish setup',
                      subtitle: 'Secure your new account',
                      children: [
                        _buildField(
                          'Email Address',
                          _emailController,
                          Icons.email_outlined,
                          hint: 'you@example.com',
                          keyboardType: TextInputType.emailAddress,
                          validator: (val) {
                            if (val == null || val.isEmpty) return 'Required';
                            if (!val.contains('@')) return 'Invalid email';
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        _buildField(
                          'Password',
                          _passwordController,
                          Icons.lock_outline,
                          obscure: _obscurePassword,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                            ),
                            onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword,
                            ),
                          ),
                          validator: (val) => (val?.length ?? 0) < 6
                              ? 'Min 6 characters'
                              : null,
                        ),
                        const SizedBox(height: 24),
                        _buildField(
                          'Confirm Password',
                          _confirmPasswordController,
                          Icons.lock_outline,
                          obscure: _obscureConfirmPassword,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureConfirmPassword
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                            ),
                            onPressed: () => setState(
                              () => _obscureConfirmPassword =
                                  !_obscureConfirmPassword,
                            ),
                          ),
                          validator: (val) {
                            if (val != _passwordController.text) {
                              return 'Passwords match required';
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              _buildBottomNav(isLoading),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () {
              if (_currentPage > 0) {
                _previousPage();
              } else {
                Navigator.pop(context);
              }
            },
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
              padding: const EdgeInsets.all(12),
            ),
          ),
          const Spacer(),
          Text(
            'Step ${_currentPage + 1} of $_totalPages',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w800,
              fontSize: 14,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    return Container(
      width: double.infinity,
      height: 4,
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Stack(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            width:
                MediaQuery.of(context).size.width *
                ((_currentPage + 1) / _totalPages),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
              ),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep({
    required GlobalKey<FormState> formKey,
    required String title,
    required String subtitle,
    required List<Widget> children,
  }) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: GoogleFonts.outfit(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: AppTheme.textHeadingColor,
              ),
            ).animate().fadeIn().slideX(begin: 0.1),
            Text(
              subtitle,
              style: GoogleFonts.outfit(
                fontSize: 16,
                color: Colors.grey,
                fontWeight: FontWeight.w500,
              ),
            ).animate().fadeIn(delay: 100.ms).slideX(begin: 0.1),
            const SizedBox(height: 40),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildDateField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Date of Birth',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14),
        ),
        const SizedBox(height: 10),
        TextFormField(
          controller: _dobController,
          readOnly: true,
          onTap: _pickDate,
          decoration: const InputDecoration(
            prefixIcon: Icon(Icons.calendar_today_rounded),
            hintText: 'Select your birth date',
          ),
          validator: (val) =>
              val?.isEmpty ?? true ? 'Birthday is required' : null,
        ),
      ],
    );
  }

  /// NEW: Gender selector widget
  Widget _buildGenderSelector() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Gender',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _buildGenderOption('MALE', Icons.male_rounded, isDark),
            const SizedBox(width: 12),
            _buildGenderOption('FEMALE', Icons.female_rounded, isDark),
            const SizedBox(width: 12),
            _buildGenderOption('OTHER', Icons.transgender_rounded, isDark),
          ],
        ),
        if (_selectedGender == null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text(
              'Please select your gender',
              style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey),
            ),
          ),
      ],
    );
  }

  Widget _buildGenderOption(String value, IconData icon, bool isDark) {
    final isSelected = _selectedGender == value;
    Color cardColor;
    if (value == 'MALE') {
      cardColor = Colors.blue;
    } else if (value == 'FEMALE') {
      cardColor = Colors.pink;
    } else {
      cardColor = Colors.purple;
    }

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedGender = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: isSelected
                ? cardColor.withOpacity(0.12)
                : (isDark
                      ? Colors.white.withOpacity(0.04)
                      : Colors.grey.shade50),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isSelected ? cardColor : Colors.grey.withOpacity(0.2),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? cardColor : Colors.grey, size: 28),
              const SizedBox(height: 6),
              Text(
                value,
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: isSelected ? cardColor : Colors.grey,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// NEW: Phone number field with country code picker
  Widget _buildPhoneField() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Phone Number',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark
                  ? Colors.white.withOpacity(0.1)
                  : Colors.grey.withOpacity(0.2),
            ),
          ),
          child: Row(
            children: [
              // Country Code Picker
              CountryCodePicker(
                onChanged: (code) {
                  setState(() {
                    _countryCode = code.dialCode ?? '+91';
                  });
                },
                initialSelection: 'IN',
                favorite: const ['+91', 'IN', '+1', 'US', '+44', 'GB'],
                showCountryOnly: false,
                showOnlyCountryWhenClosed: false,
                alignLeft: false,
                showFlag: true,
                showFlagDialog: true,
                showDropDownButton: true,
                dialogSize: const Size(double.infinity, 600),
                searchDecoration: InputDecoration(
                  hintText: 'Search country...',
                  hintStyle: GoogleFonts.outfit(),
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                textStyle: GoogleFonts.outfit(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: isDark ? Colors.white : Colors.black87,
                ),
                dialogTextStyle: GoogleFonts.outfit(
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : Colors.black87,
                ),
                flagDecoration: const BoxDecoration(
                  borderRadius: BorderRadius.all(Radius.circular(4)),
                ),
              ),
              // Divider
              Container(
                height: 30,
                width: 1,
                color: isDark ? Colors.white24 : Colors.grey.shade300,
              ),
              // Phone number input
              Expanded(
                child: TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                  decoration: InputDecoration(
                    hintText: 'Mobile number (optional)',
                    hintStyle: GoogleFonts.outfit(
                      color: Colors.grey,
                      fontWeight: FontWeight.normal,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  validator: (val) {
                    if (val == null || val.isEmpty) return null; // Optional
                    if (val.length < 6) return 'Too short';
                    return null;
                  },
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 6, left: 4),
          child: Text(
            'Select your country code, then enter your number',
            style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey),
          ),
        ),
      ],
    );
  }

  Widget _buildExamsChipGroup() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Target Competitive Exams',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14),
        ),
        const SizedBox(height: 4),
        const Text(
          'Choose the exams you are preparing for',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children:
              (_examsList.isEmpty
                      ? ['JEE', 'NEET', 'CUET', 'NDA', 'CLAT']
                      : _examsList)
                  .map((exam) {
                    final isSelected = _selectedExams.contains(exam);
                    return FilterChip(
                      label: Text(exam),
                      selected: isSelected,
                      onSelected: (val) {
                        setState(() {
                          if (val) {
                            _selectedExams.add(exam);
                          } else {
                            _selectedExams.remove(exam);
                          }
                        });
                      },
                      backgroundColor: Colors.transparent,
                      selectedColor: AppTheme.primaryColor,
                      checkmarkColor: Colors.white,
                      labelStyle: GoogleFonts.outfit(
                        color: isSelected ? Colors.white : Colors.grey.shade700,
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.w500,
                      ),
                      side: BorderSide(
                        color: isSelected
                            ? AppTheme.primaryColor
                            : Colors.grey.withOpacity(0.3),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    );
                  })
                  .toList(),
        ),
      ],
    );
  }

  Widget _buildBottomNav(bool isLoading) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentPage > 0)
            Expanded(
              flex: 1,
              child: OutlinedButton(
                onPressed: isLoading ? null : _previousPage,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 60),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                child: const Text('BACK'),
              ),
            ),
          if (_currentPage > 0) const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: isLoading ? null : _nextPage,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                minimumSize: const Size(double.infinity, 60),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(
                      _currentPage == _totalPages - 1
                          ? 'GET STARTED'
                          : 'CONTINUE',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildField(
    String label,
    TextEditingController controller,
    IconData icon, {
    bool obscure = false,
    Widget? suffixIcon,
    String? hint,
    TextInputType? keyboardType,
    bool required = true,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14),
        ),
        const SizedBox(height: 10),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            prefixIcon: Icon(icon),
            hintText: hint ?? 'Enter $label',
            suffixIcon: suffixIcon,
          ),
          validator:
              validator ??
              (val) {
                if (!required) return null;
                return (val?.isEmpty ?? true) ? 'Required field' : null;
              },
        ),
      ],
    );
  }

  Widget _buildDropdown(
    String label,
    String? value,
    List<String> items,
    IconData icon,
    Function(String?) onChanged, {
    bool required = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14),
        ),
        const SizedBox(height: 10),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w600,
            color: AppTheme.textBodyColor,
          ),
          items: items.map((e) {
            return DropdownMenuItem(value: e, child: Text(e));
          }).toList(),
          onChanged: onChanged,
          decoration: InputDecoration(prefixIcon: Icon(icon)),
          validator: required
              ? (val) => val == null ? 'Selection required' : null
              : null,
        ),
      ],
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _dobController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
}
