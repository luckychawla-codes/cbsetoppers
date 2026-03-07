import 'dart:io';
import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:open_filex/open_filex.dart';
import 'package:dio/dio.dart';

/// Get cache path for PDF preview (native only)
Future<String?> getCachePath(String title) async {
  try {
    final dir = await getTemporaryDirectory();
    final safeName =
        title.replaceAll(RegExp(r'[^\w\s-]'), '').replaceAll(' ', '_');
    return '${dir.path}/$safeName.pdf';
  } catch (_) {
    return null;
  }
}

/// Check if a file exists
Future<bool> fileExists(String path) async {
  return File(path).existsSync();
}

/// Build a file-based PDF viewer widget
Widget buildFileViewer(
  String filePath,
  GlobalKey<SfPdfViewerState> key, {
  required VoidCallback onFailed,
}) {
  return SfPdfViewer.file(
    File(filePath),
    key: key,
    canShowScrollHead: true,
    canShowScrollStatus: true,
    onDocumentLoadFailed: (details) => onFailed(),
  );
}

/// Save PDF to device Downloads folder
Future<String?> saveToDevice({
  required String url,
  required String title,
  String? localFilePath,
  required Function(double) onProgress,
}) async {
  var status = await Permission.storage.request();
  if (Platform.isAndroid && !status.isGranted) {
    status = await Permission.manageExternalStorage.request();
  }

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
      "${title.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.pdf";
  final savePath = "${dir?.path}/$fileName";

  // If we already have a local copy, just copy it
  if (localFilePath != null && await File(localFilePath).exists()) {
    await File(localFilePath).copy(savePath);
    onProgress(1.0);
    return savePath;
  }

  await Dio().download(
    url,
    savePath,
    options: Options(receiveTimeout: const Duration(minutes: 10)),
    onReceiveProgress: (received, total) {
      if (total != -1) {
        onProgress(received / total);
      }
    },
  );

  return savePath;
}

/// Open a file with the system viewer
void openFile(String path) {
  OpenFilex.open(path);
}

/// No-op on native — web download only
void downloadOnWeb(String url, String title) {
  // Not applicable on native platforms
}
