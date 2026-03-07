import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:open_filex/open_filex.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import 'dart:io';

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
  String? _localFilePath; // once downloaded, we preview from here
  bool _loadingFromNetwork = true; // start by attempting network preview

  final GlobalKey<SfPdfViewerState> _pdfViewerKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    // For Google Drive URLs, always download first (they can't be streamed)
    if (_isDriveUrl(widget.pdfUrl)) {
      _downloadForPreview();
    }
  }

  bool _isDriveUrl(String url) {
    return url.contains('drive.google.com') ||
        url.contains('drive.usercontent.google.com');
  }

  /// Downloads file to app cache, then opens in the in-app viewer
  Future<void> _downloadForPreview() async {
    setState(() {
      _isLoadingForPreview = true;
      _downloadProgress = 0;
      _loadingFromNetwork = false;
    });

    try {
      final dir = await getTemporaryDirectory();
      final safeName = widget.title
          .replaceAll(RegExp(r'[^\w\s-]'), '')
          .replaceAll(' ', '_');
      final cachePath = '${dir.path}/$safeName.pdf';
      final cacheFile = File(cachePath);

      // Reuse cached file if already downloaded
      if (await cacheFile.exists()) {
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
      if (mounted) {
        setState(() {
          _isLoadingForPreview = false;
          _previewFailed = true;
        });
      }
    }
  }

  Future<void> _saveToDevice() async {
    var status = await Permission.storage.request();
    if (Platform.isAndroid && !status.isGranted) {
      status = await Permission.manageExternalStorage.request();
    }

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0;
    });

    try {
      Directory? dir;
      if (Platform.isAndroid) {
        dir = Directory('/storage/emulated/0/Download');
        if (!await dir.exists()) {
          dir = await getExternalStorageDirectory();
        }
      } else {
        dir = await getApplicationDocumentsDirectory();
      }

      final fileName =
          "${widget.title.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.pdf";
      final savePath = "${dir?.path}/$fileName";

      // If we already have a local copy, just copy it
      if (_localFilePath != null && await File(_localFilePath!).exists()) {
        await File(_localFilePath!).copy(savePath);
        setState(() {
          _isDownloading = false;
          _downloadProgress = 1.0;
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Saved to Downloads: $fileName'),
            action: SnackBarAction(
              label: 'OPEN',
              textColor: Colors.white,
              onPressed: () => OpenFilex.open(savePath),
            ),
          ),
        );
        return;
      }

      await Dio().download(
        widget.pdfUrl,
        savePath,
        options: Options(receiveTimeout: const Duration(minutes: 10)),
        onReceiveProgress: (received, total) {
          if (total != -1) {
            setState(() => _downloadProgress = received / total);
          }
        },
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Download complete! Saved to $fileName'),
          action: SnackBarAction(
            label: 'OPEN',
            textColor: Colors.white,
            onPressed: () => OpenFilex.open(savePath),
          ),
        ),
      );
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

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title, style: const TextStyle(fontSize: 16)),
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
              onPressed: _saveToDevice,
            ),
        ],
      ),
      body: _buildBody(isDark),
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

    // Local file ready — render from disk
    if (_localFilePath != null) {
      return SfPdfViewer.file(
        File(_localFilePath!),
        key: _pdfViewerKey,
        canShowScrollHead: true,
        canShowScrollStatus: true,
        onDocumentLoadFailed: (details) {
          if (mounted) {
            setState(() => _previewFailed = true);
          }
        },
      );
    }

    // Network stream (non-Drive URLs)
    return SfPdfViewer.network(
      widget.pdfUrl,
      key: _pdfViewerKey,
      canShowScrollHead: true,
      canShowScrollStatus: true,
      onDocumentLoadFailed: (details) {
        // Network stream failed — try downloading
        if (mounted) {
          setState(() => _loadingFromNetwork = false);
          _downloadForPreview();
        }
      },
    );
  }

  Widget _buildLoadingState(bool isDark) {
    final pct = (_downloadProgress * 100).toInt();
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
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
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: _downloadProgress > 0 ? _downloadProgress : null,
                backgroundColor: Colors.grey.withOpacity(0.2),
                valueColor: const AlwaysStoppedAnimation(AppTheme.primaryColor),
                minHeight: 6,
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
    );
  }

  Widget _buildFailedState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
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
              'PREVIEW UNAVAILABLE',
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.w900,
                fontSize: 16,
                letterSpacing: 2,
                color: isDark ? Colors.white : AppTheme.textHeadingColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'This PDF is too large to preview directly.\nDownload it to view in your PDF reader.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 13,
                color: Colors.grey,
                fontWeight: FontWeight.w600,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
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
                    : const Icon(Icons.download_rounded, color: Colors.white),
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
              'Saved to your Downloads folder',
              style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
