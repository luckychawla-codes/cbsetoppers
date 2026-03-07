import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:dio/dio.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';

// Conditional imports for non-web platforms
import 'pdf_viewer_native.dart'
    if (dart.library.html) 'pdf_viewer_web.dart'
    as platform_helper;

class PdfViewerScreen extends StatefulWidget {
  final String pdfUrl;
  final String title;

  const PdfViewerScreen({super.key, required this.pdfUrl, required this.title});

  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  bool _isDownloading = false;
  double _downloadProgress = 0;
  bool _isLoadingForPreview = false;
  bool _previewFailed = false;
  String? _localFilePath;
  int _networkRetryCount = 0;
  String? _errorReason;

  final GlobalKey<SfPdfViewerState> _pdfViewerKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    // On web, always use network viewer directly — no file download for preview
    if (kIsWeb) return;
    // For Google Drive URLs on native, download first (they can't be streamed)
    if (_isDriveUrl(widget.pdfUrl)) {
      _downloadForPreview();
    }
  }

  bool _isDriveUrl(String url) {
    return url.contains('drive.google.com') ||
        url.contains('drive.usercontent.google.com');
  }

  /// Get a direct-download URL for Google Drive links
  String _getDirectUrl(String url) {
    // Convert Google Drive share/view URLs to direct download
    final regExp = RegExp(r'/d/([a-zA-Z0-9_-]+)');
    final match = regExp.firstMatch(url);
    if (match != null) {
      final fileId = match.group(1);
      return 'https://drive.google.com/uc?export=download&id=$fileId';
    }
    // Already a direct link or usercontent link
    if (url.contains('drive.usercontent.google.com')) {
      if (!url.contains('export=download')) {
        final sep = url.contains('?') ? '&' : '?';
        return '${url}${sep}export=download';
      }
    }
    return url;
  }

  /// Downloads file to app cache (NATIVE ONLY), then opens in the in-app viewer
  Future<void> _downloadForPreview() async {
    if (kIsWeb) return; // Never download for preview on web

    setState(() {
      _isLoadingForPreview = true;
      _downloadProgress = 0;
    });

    try {
      final cachePath = await platform_helper.getCachePath(widget.title);
      if (cachePath == null) {
        setState(() {
          _isLoadingForPreview = false;
          _previewFailed = true;
          _errorReason = 'Could not create cache directory';
        });
        return;
      }

      final exists = await platform_helper.fileExists(cachePath);
      if (exists) {
        setState(() {
          _localFilePath = cachePath;
          _isLoadingForPreview = false;
          _downloadProgress = 1.0;
        });
        return;
      }

      await Dio().download(
        widget.pdfUrl,
        cachePath,
        options: Options(
          receiveTimeout: const Duration(minutes: 10),
          sendTimeout: const Duration(minutes: 5),
        ),
        onReceiveProgress: (received, total) {
          if (total != -1 && mounted) {
            setState(() => _downloadProgress = received / total);
          }
        },
      );

      if (mounted) {
        setState(() {
          _localFilePath = cachePath;
          _isLoadingForPreview = false;
        });
      }
    } catch (e) {
      debugPrint('Download for preview failed: $e');
      if (mounted) {
        setState(() {
          _isLoadingForPreview = false;
          _previewFailed = true;
          _errorReason = e.toString();
        });
      }
    }
  }

  Future<void> _saveToDevice() async {
    if (kIsWeb) {
      // On web, directly trigger browser download – no async shenanigans
      final dlUrl = _isDriveUrl(widget.pdfUrl)
          ? _getDirectUrl(widget.pdfUrl)
          : widget.pdfUrl;
      platform_helper.downloadOnWeb(dlUrl, widget.title);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Download started in your browser!',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
            ),
            backgroundColor: AppTheme.primaryColor,
          ),
        );
      }
      return;
    }

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0;
    });

    try {
      final savePath = await platform_helper.saveToDevice(
        url: widget.pdfUrl,
        title: widget.title,
        localFilePath: _localFilePath,
        onProgress: (progress) {
          if (mounted) setState(() => _downloadProgress = progress);
        },
      );

      if (!mounted) return;
      setState(() {
        _isDownloading = false;
        _downloadProgress = 1.0;
      });
      if (savePath != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Saved: ${savePath.split('/').last}'),
            action: SnackBarAction(
              label: 'OPEN',
              textColor: Colors.white,
              onPressed: () => platform_helper.openFile(savePath),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Download failed: $e')));
    } finally {
      if (mounted) {
        setState(() {
          _isDownloading = false;
          _downloadProgress = 0;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth > 800;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.title,
          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isLoadingForPreview)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    value: _downloadProgress > 0 ? _downloadProgress : null,
                    strokeWidth: 2,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
            )
          else if (_isDownloading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    value: _downloadProgress > 0 ? _downloadProgress : null,
                    strokeWidth: 2,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.download_rounded),
              tooltip: 'Download PDF',
              onPressed: _saveToDevice,
            ),
          if (isDesktop) const SizedBox(width: 16),
        ],
      ),
      body: isDesktop
          ? Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 1100),
                margin: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.4 : 0.08),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: _buildBody(isDark),
              ),
            )
          : _buildBody(isDark),
    );
  }

  Widget _buildBody(bool isDark) {
    // Loading state while downloading for preview
    if (_isLoadingForPreview) {
      return _buildLoadingState(isDark);
    }

    // Preview failed — offer download option
    if (_previewFailed) {
      return _buildFailedState(isDark);
    }

    // Local file ready — render from disk (native only)
    if (_localFilePath != null && !kIsWeb) {
      return platform_helper.buildFileViewer(
        _localFilePath!,
        _pdfViewerKey,
        onFailed: () {
          if (mounted) {
            setState(() {
              _previewFailed = true;
              _errorReason = 'File could not be rendered';
            });
          }
        },
      );
    }

    // Network stream — works on both web and native
    return SfPdfViewer.network(
      widget.pdfUrl,
      key: _pdfViewerKey,
      canShowScrollHead: true,
      canShowScrollStatus: true,
      onDocumentLoadFailed: (details) {
        debugPrint('PDF network load failed: ${details.description}');
        if (!kIsWeb && _networkRetryCount == 0 && mounted) {
          // On native, try downloading the file first (handles Drive URLs etc.)
          _networkRetryCount++;
          _downloadForPreview();
        } else if (mounted) {
          setState(() {
            _previewFailed = true;
            _errorReason = details.description;
          });
        }
      },
    );
  }

  Widget _buildLoadingState(bool isDark) {
    final pct = (_downloadProgress * 100).toInt();
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.picture_as_pdf_rounded,
                  size: 48,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'LOADING PDF',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                  letterSpacing: 2,
                  color: isDark ? Colors.white : AppTheme.textHeadingColor,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _downloadProgress > 0
                    ? 'Downloading... $pct%'
                    : 'Preparing document...',
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  color: Colors.grey,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: 300,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: _downloadProgress > 0 ? _downloadProgress : null,
                    backgroundColor: Colors.grey.withOpacity(0.2),
                    valueColor: const AlwaysStoppedAnimation(
                      AppTheme.primaryColor,
                    ),
                    minHeight: 6,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Large PDFs are downloaded locally\nbefore previewing for best experience.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFailedState(bool isDark) {
    // Determine if the error is size-related
    final bool isSizeError =
        _errorReason != null &&
        (_errorReason!.toLowerCase().contains('large') ||
            _errorReason!.toLowerCase().contains('size') ||
            _errorReason!.toLowerCase().contains('memory') ||
            _errorReason!.toLowerCase().contains('out of'));

    return Center(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.cloud_download_outlined,
                    size: 48,
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  isSizeError ? 'VERY LARGE PREVIEW' : 'COULD NOT LOAD PDF',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    letterSpacing: 2,
                    color: isDark ? Colors.white : AppTheme.textHeadingColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  isSizeError
                      ? 'This PDF is too large to preview in-app.\nDownload it to view in your PDF reader.'
                      : kIsWeb
                      ? 'This PDF could not be loaded in the browser.\nClick below to download it directly.'
                      : 'Something went wrong loading this PDF.\nTry again or download it to view externally.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    color: Colors.grey,
                    fontWeight: FontWeight.w600,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                // Retry button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      setState(() {
                        _previewFailed = false;
                        _networkRetryCount = 0;
                        _localFilePath = null;
                        _errorReason = null;
                      });
                    },
                    icon: const Icon(Icons.refresh_rounded),
                    label: Text(
                      'RETRY PREVIEW',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.primaryColor),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: _isDownloading ? null : _saveToDevice,
                    icon: _isDownloading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(
                            Icons.download_rounded,
                            color: Colors.white,
                          ),
                    label: Text(
                      _isDownloading
                          ? 'DOWNLOADING ${(_downloadProgress * 100).toInt()}%...'
                          : 'DOWNLOAD TO DEVICE',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 1,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  kIsWeb
                      ? 'File will download through your browser'
                      : 'Saved to your Downloads folder',
                  style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
