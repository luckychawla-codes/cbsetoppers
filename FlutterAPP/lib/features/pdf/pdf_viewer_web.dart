import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;

/// No-op on web — cache path not applicable
Future<String?> getCachePath(String title) async => null;

/// No-op on web
Future<bool> fileExists(String path) async => false;

/// No-op on web — file viewer not used
Widget buildFileViewer(
  String filePath,
  GlobalKey<SfPdfViewerState> key, {
  required VoidCallback onFailed,
}) {
  return const Center(child: Text('File viewer not available on web'));
}

/// No-op on web — download handled by downloadOnWeb
Future<String?> saveToDevice({
  required String url,
  required String title,
  String? localFilePath,
  required Function(double) onProgress,
}) async {
  downloadOnWeb(url, title);
  onProgress(1.0);
  return null;
}

/// No-op on web
void openFile(String path) {}

/// Trigger a browser download for the given URL
void downloadOnWeb(String url, String title) {
  final anchor = html.AnchorElement(href: url)
    ..setAttribute('download', '${title.replaceAll(' ', '_')}.pdf')
    ..setAttribute('target', '_blank')
    ..style.display = 'none';
  html.document.body?.append(anchor);
  anchor.click();
  // Small delay before cleanup to let browser pick up the click
  Future.delayed(const Duration(milliseconds: 100), () {
    anchor.remove();
  });
}
