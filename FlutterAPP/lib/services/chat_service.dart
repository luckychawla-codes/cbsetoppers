import 'package:firebase_database/firebase_database.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as types;

/// Persists AI chat messages to Firebase Realtime Database.
///
/// RTDB structure:
///   chat_history
///     └── {studentId}
///           └── messages
///                 └── {messageId}
///                       role      : 'user' | 'assistant'
///                       text      : String
///                       imageUrl  : String?   (for image messages)
///                       authorId  : String
///                       authorName: String
///                       createdAt : int (milliseconds since epoch)
class ChatService {
  DatabaseReference get _dbRef => FirebaseDatabase.instance.ref();

  // Sanitize studentId for use as Firebase RTDB key
  // RTDB keys cannot contain: . $ # [ ] /
  String _sanitizeKey(String key) {
    return key
        .replaceAll('.', '_')
        .replaceAll('#', '_')
        .replaceAll('\$', '_')
        .replaceAll('[', '_')
        .replaceAll(']', '_')
        .replaceAll('/', '_');
  }

  DatabaseReference _messagesRef(String studentId) => _dbRef
      .child('chat_history')
      .child(_sanitizeKey(studentId))
      .child('messages');

  // ── Save one message ────────────────────────────────────────────────────────
  Future<void> saveMessage({
    required String studentId,
    required types.Message message,
  }) async {
    print('DEBUG: Saving message to RTDB for student: $studentId');
    try {
      final ref = _messagesRef(studentId).child(message.id);

      if (message is types.TextMessage) {
        await ref.set({
          'id': message.id,
          'role': message.author.id == 'topper-ai' ? 'assistant' : 'user',
          'type': 'text',
          'text': message.text,
          'authorId': message.author.id,
          'authorName': message.author.firstName ?? '',
          'createdAt':
              message.createdAt ?? DateTime.now().millisecondsSinceEpoch,
        });
      } else if (message is types.ImageMessage) {
        await ref.set({
          'id': message.id,
          'role': 'assistant',
          'type': 'image',
          'imageUrl': message.uri,
          'imageName': message.name,
          'authorId': message.author.id,
          'authorName': message.author.firstName ?? '',
          'createdAt':
              message.createdAt ?? DateTime.now().millisecondsSinceEpoch,
        });
      }
      print('DEBUG: Message saved successfully');
    } catch (e) {
      print('ERROR: Failed to save message to RTDB: $e');
    }
  }

  // ── Load history (most recent first, limit 100) ────────────────────────────
  Future<List<types.Message>> loadHistory(String studentId) async {
    final aiUser = const types.User(
      id: 'topper-ai',
      firstName: 'TopperAI',
      imageUrl:
          'https://hkdkhzfdmvcxvopasohm.supabase.co/storage/v1/object/public/assets/topper-ai.png',
    );

    try {
      print('DEBUG: Loading chat history for student: $studentId');

      // Try loading with limitToLast to get the most recent 100 messages
      final snapshot = await _messagesRef(
        studentId,
      ).orderByChild('createdAt').limitToLast(100).get();

      print('DEBUG: Snapshot exists: ${snapshot.exists}');

      if (!snapshot.exists || snapshot.value == null) {
        print('DEBUG: No history found for student: $studentId');
        return [];
      }

      final List<types.Message> messages = [];

      // Firebase RTDB snapshot.value can be a Map or List
      dynamic rawValue = snapshot.value;

      Map<dynamic, dynamic> data;
      if (rawValue is Map) {
        data = Map<dynamic, dynamic>.from(rawValue);
      } else if (rawValue is List) {
        // Convert List to Map using index as key
        data = {};
        for (int i = 0; i < rawValue.length; i++) {
          if (rawValue[i] != null) {
            data[i.toString()] = rawValue[i];
          }
        }
      } else {
        return [];
      }

      data.forEach((key, value) {
        if (value is Map) {
          try {
            final msgData = Map<dynamic, dynamic>.from(value);
            final authorId = msgData['authorId']?.toString() ?? '';
            final authorName = msgData['authorName']?.toString() ?? '';
            final author = authorId == 'topper-ai'
                ? aiUser
                : types.User(
                    id: authorId.isNotEmpty ? authorId : 'user',
                    firstName: authorName,
                  );

            final createdAt = msgData['createdAt'] is int
                ? msgData['createdAt'] as int
                : (msgData['createdAt'] as num?)?.toInt() ??
                      DateTime.now().millisecondsSinceEpoch;

            final type = msgData['type']?.toString() ?? 'text';
            final msgId = msgData['id']?.toString() ?? key.toString();

            if (type == 'image') {
              messages.add(
                types.ImageMessage(
                  id: msgId,
                  author: author,
                  createdAt: createdAt,
                  name: msgData['imageName']?.toString() ?? 'Image',
                  size: 1024,
                  uri: msgData['imageUrl']?.toString() ?? '',
                ),
              );
            } else {
              final text = msgData['text']?.toString() ?? '';
              if (text.isNotEmpty) {
                messages.add(
                  types.TextMessage(
                    id: msgId,
                    author: author,
                    createdAt: createdAt,
                    text: text,
                  ),
                );
              }
            }
          } catch (e) {
            print('DEBUG: Error parsing message entry: $e');
          }
        }
      });

      print('DEBUG: Loaded ${messages.length} messages from RTDB');

      // Sort messages: newest first (since we'll insert into a list that is reversed in the UI)
      messages.sort((a, b) => (b.createdAt ?? 0).compareTo(a.createdAt ?? 0));
      return messages;
    } catch (e) {
      print('ERROR: Failed to load history from RTDB: $e');
      return [];
    }
  }

  // ── Clear history for a student ────────────────────────────────────────────
  Future<void> clearHistory(String studentId) async {
    try {
      await _messagesRef(studentId).remove();
    } catch (e) {
      print('ERROR: Failed to clear history: $e');
    }
  }
}
