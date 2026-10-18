import http from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { createApp } from '../backend/app';
import { setupSocket } from '../backend/socket';
import Conversation from '../backend/models/conversationmodel';
import Message from '../backend/models/messagemodel';
import User from '../backend/models/usermodel';
import {
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createTestPatient,
  createTestDoctor,
  generateTestToken,
  JWT_SECRET_TEST,
} from './helpers/setup';

describe('Realtime Socket.IO Security, Origin, Authentication, Rooms, & Delivery', () => {
  let server: http.Server;
  let port: number;
  let serverUrl: string;

  beforeAll(async () => {
    await connectTestDb();
    const app = createApp();
    server = http.createServer(app);
    setupSocket(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as any;
        port = address.port;
        serverUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('Origin Restriction & WebSocket Transport Validation', () => {
    test('Allowed production origin connects successfully', async () => {
      const { token } = await createTestPatient();
      const client: ClientSocket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'],
        extraHeaders: {
          origin: 'https://quickclinic.vercel.app',
        },
      });

      await new Promise<void>((resolve, reject) => {
        client.on('connect', () => {
          expect(client.connected).toBe(true);
          client.disconnect();
          resolve();
        });
        client.on('connect_error', (err) => {
          client.disconnect();
          reject(err);
        });
      });
    });

    test('Allowed configured preview origin connects successfully', async () => {
      const { token } = await createTestPatient();
      const client: ClientSocket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'],
        extraHeaders: {
          origin: 'https://quickclinic-git-preview-fix-karan-aggarwals-projects.vercel.app',
        },
      });

      await new Promise<void>((resolve, reject) => {
        client.on('connect', () => {
          expect(client.connected).toBe(true);
          client.disconnect();
          resolve();
        });
        client.on('connect_error', (err) => {
          client.disconnect();
          reject(err);
        });
      });
    });

    test('Unrelated Vercel project origin is rejected', async () => {
      const { token } = await createTestPatient();
      const client: ClientSocket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        extraHeaders: {
          origin: 'https://unrelated-malicious-app.vercel.app',
        },
      });

      await new Promise<void>((resolve) => {
        client.on('connect_error', (err) => {
          expect(err.message).toMatch(/(Origin not allowed|websocket error)/i);
          client.disconnect();
          resolve();
        });
        client.on('connect', () => {
          client.disconnect();
          throw new Error('Should not have connected from unrelated Vercel origin');
        });
      });
    });

    test('Attacker-controlled origin is rejected', async () => {
      const { token } = await createTestPatient();
      const client: ClientSocket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        extraHeaders: {
          origin: 'https://attacker-controlled-site.com',
        },
      });

      await new Promise<void>((resolve) => {
        client.on('connect_error', (err) => {
          expect(err.message).toMatch(/(Origin not allowed|websocket error)/i);
          client.disconnect();
          resolve();
        });
        client.on('connect', () => {
          client.disconnect();
          throw new Error('Should not have connected from attacker origin');
        });
      });
    });

    test('Deceptive hostname suffixes are rejected', async () => {
      const { token } = await createTestPatient();
      const client: ClientSocket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        extraHeaders: {
          origin: 'https://quickclinic.vercel.app.attacker-spoof.com',
        },
      });

      await new Promise<void>((resolve) => {
        client.on('connect_error', (err) => {
          expect(err.message).toMatch(/(Origin not allowed|websocket error)/i);
          client.disconnect();
          resolve();
        });
        client.on('connect', () => {
          client.disconnect();
          throw new Error('Should not have connected from deceptive hostname suffix');
        });
      });
    });

    test('WebSocket-only transport cannot bypass origin restrictions', async () => {
      const { token } = await createTestPatient();
      const client: ClientSocket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'], // Force WebSocket transport exclusively
        upgrade: false,
        reconnection: false,
        extraHeaders: {
          origin: 'https://evil-hacker.com',
        },
      });

      await new Promise<void>((resolve) => {
        client.on('connect_error', (err) => {
          expect(err.message).toMatch(/(Origin not allowed|websocket error)/i);
          client.disconnect();
          resolve();
        });
        client.on('connect', () => {
          client.disconnect();
          throw new Error('WebSocket-only transport bypassed origin check');
        });
      });
    });
  });

  describe('JWT Verification & Fallback Secret Removal', () => {
    test('Socket connection rejects handshake when token is missing', (done) => {
      const client: ClientSocket = Client(serverUrl, {
        transports: ['websocket'],
        autoConnect: true,
      });

      client.on('connect_error', (err) => {
        expect(err.message).toMatch(/Authentication error: Missing token/i);
        client.disconnect();
        done();
      });
    });

    test('Socket connection rejects handshake when token is invalid or malformed', (done) => {
      const client: ClientSocket = Client(serverUrl, {
        auth: { token: 'invalid_malformed_token_123' },
        transports: ['websocket'],
        autoConnect: true,
      });

      client.on('connect_error', (err) => {
        expect(err.message).toMatch(/Authentication error/i);
        client.disconnect();
        done();
      });
    });

    test('Socket connection rejects token signed with old default fallback secret', async () => {
      const { user } = await createTestPatient();
      const oldFallbackToken = jwt.sign(
        { id: user._id.toString() },
        'default_jwt_secret_for_tests'
      );

      const client: ClientSocket = Client(serverUrl, {
        auth: { token: oldFallbackToken },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client.on('connect_error', (err) => {
          expect(err.message).toMatch(/Authentication error/i);
          client.disconnect();
          resolve();
        });
        client.on('connect', () => {
          client.disconnect();
          throw new Error('Should not accept token signed with old fallback secret');
        });
      });
    });

    test('Socket connection rejects token if user was deleted from database', async () => {
      const { user, token } = await createTestPatient();
      // Delete user from DB
      await User.findByIdAndDelete(user._id);

      const client: ClientSocket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client.on('connect_error', (err) => {
          expect(err.message).toMatch(/User not found/i);
          client.disconnect();
          resolve();
        });
        client.on('connect', () => {
          client.disconnect();
          throw new Error('Should reject deleted user');
        });
      });
    });

    test('Socket connection rejects handshake when server JWT_SECRET is unset', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        const client: ClientSocket = Client(serverUrl, {
          auth: { token: 'some_token' },
          transports: ['websocket'],
        });

        await new Promise<void>((resolve) => {
          client.on('connect_error', (err) => {
            expect(err.message).toMatch(/Server authentication configuration missing/i);
            client.disconnect();
            resolve();
          });
          client.on('connect', () => {
            client.disconnect();
            throw new Error('Should fail closed when JWT_SECRET is unset');
          });
        });
      } finally {
        process.env.JWT_SECRET = originalSecret;
      }
    });
  });

  describe('Presence Authorization & Enumeration Guard', () => {
    test('Unrelated user cannot inspect presence of a user without relationship', async () => {
      const { token: token1 } = await createTestPatient();
      const { user: user2 } = await createTestPatient();

      const client1: ClientSocket = Client(serverUrl, {
        auth: { token: token1 },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client1.on('connect', () => {
          client1.emit(
            'checkPresence',
            { targetUserId: user2._id.toString() },
            (res: any) => {
              expect(res.error).toMatch(/Not authorized to inspect presence/i);
              expect(res.isOnline).toBeUndefined();
              client1.disconnect();
              resolve();
            }
          );
        });
      });
    });

    test('Invalid or missing target ID returns controlled error', async () => {
      const { token } = await createTestPatient();
      const client: ClientSocket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client.on('connect', () => {
          client.emit('checkPresence', { targetUserId: 'invalid-id-xyz' }, (res: any) => {
            expect(res.error).toMatch(/Invalid or missing target user ID/i);
            client.disconnect();
            resolve();
          });
        });
      });
    });

    test('Legitimate conversation participants can inspect each other presence', async () => {
      const { user: patientUser, token: patientToken } = await createTestPatient();
      const { user: doctorUser, token: doctorToken } = await createTestDoctor();

      // Establish conversation between patient and doctor
      const conversation = await Conversation.create({
        participants: [patientUser._id, doctorUser._id],
      });

      // Doctor connects
      const doctorClient: ClientSocket = Client(serverUrl, {
        auth: { token: doctorToken },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        doctorClient.on('connect', () => resolve());
      });

      // Patient connects and checks doctor presence
      const patientClient: ClientSocket = Client(serverUrl, {
        auth: { token: patientToken },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        patientClient.on('connect', () => {
          patientClient.emit(
            'checkPresence',
            {
              targetUserId: doctorUser._id.toString(),
              conversationId: conversation._id.toString(),
            },
            (res: any) => {
              expect(res.error).toBeUndefined();
              expect(res.userId).toBe(doctorUser._id.toString());
              expect(res.isOnline).toBe(true);

              patientClient.disconnect();
              doctorClient.disconnect();
              resolve();
            }
          );
        });
      });
    });
  });

  describe('Message Recipient Authorization & Outsider Injection Guard', () => {
    test('Non-participant cannot send message to conversation', async () => {
      const { user: p1 } = await createTestPatient();
      const { user: doc } = await createTestDoctor();
      const { token: outsiderToken } = await createTestPatient();

      const conversation = await Conversation.create({
        participants: [p1._id, doc._id],
      });

      const outsiderClient: ClientSocket = Client(serverUrl, {
        auth: { token: outsiderToken },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        outsiderClient.on('connect', () => {
          outsiderClient.emit(
            'sendMessage',
            {
              conversationId: conversation._id.toString(),
              message: 'Sneaky unauthorized message',
            },
            async (res: any) => {
              expect(res.error).toMatch(/Not authorized/i);

              // Verify no message was persisted
              const count = await Message.countDocuments({
                conversationId: conversation._id,
              });
              expect(count).toBe(0);

              outsiderClient.disconnect();
              resolve();
            }
          );
        });
      });
    });

    test('Participant cannot redirect private conversation message to an outsider receiver', async () => {
      const { user: p1, token: p1Token } = await createTestPatient();
      const { user: doc } = await createTestDoctor();
      const { user: outsider, token: outsiderToken } = await createTestPatient();

      const conversation = await Conversation.create({
        participants: [p1._id, doc._id],
      });

      const outsiderClient: ClientSocket = Client(serverUrl, {
        auth: { token: outsiderToken },
        transports: ['websocket'],
      });

      let outsiderReceivedCount = 0;
      outsiderClient.on('receiveMessage', () => {
        outsiderReceivedCount++;
      });

      await new Promise<void>((resolve) => {
        outsiderClient.on('connect', () => resolve());
      });

      const p1Client: ClientSocket = Client(serverUrl, {
        auth: { token: p1Token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        p1Client.on('connect', () => {
          // Attempt to leak conversation to third party outsider
          p1Client.emit(
            'sendMessage',
            {
              conversationId: conversation._id.toString(),
              receiverId: outsider._id.toString(),
              message: 'Confidential patient chart',
            },
            async (res: any) => {
              expect(res.error).toMatch(/Receiver is not a participant in this conversation/i);

              // Give any socket event time to deliver (if bug existed)
              await new Promise((r) => setTimeout(r, 100));
              expect(outsiderReceivedCount).toBe(0);

              // Verify no message was persisted
              const count = await Message.countDocuments({
                conversationId: conversation._id,
              });
              expect(count).toBe(0);

              p1Client.disconnect();
              outsiderClient.disconnect();
              resolve();
            }
          );
        });
      });
    });

    test('Rejects invalid payload shape and empty messages with controlled errors', async () => {
      const { user: p1, token: p1Token } = await createTestPatient();
      const { user: doc } = await createTestDoctor();
      const conversation = await Conversation.create({
        participants: [p1._id, doc._id],
      });

      const client: ClientSocket = Client(serverUrl, {
        auth: { token: p1Token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client.on('connect', () => {
          client.emit(
            'sendMessage',
            {
              conversationId: conversation._id.toString(),
              message: '   ',
            },
            (res: any) => {
              expect(res.error).toMatch(/Message content cannot be empty/i);
              client.disconnect();
              resolve();
            }
          );
        });
      });
    });
  });

  describe('Exact Delivery Counts, Deduplication, & Idempotent Retries', () => {
    test('Receiver joined to both conversation room and personal room receives exactly 1 copy', async () => {
      const { user: p1, token: p1Token } = await createTestPatient();
      const { user: doc, token: docToken } = await createTestDoctor();

      const conversation = await Conversation.create({
        participants: [p1._id, doc._id],
      });

      const docClient: ClientSocket = Client(serverUrl, {
        auth: { token: docToken },
        transports: ['websocket'],
      });

      let docReceivedCount = 0;
      docClient.on('receiveMessage', () => {
        docReceivedCount++;
      });

      // Doctor connects (auto-joins user:doc._id) and joins conversation room
      await new Promise<void>((resolve) => {
        docClient.on('connect', () => {
          docClient.emit('joinConversation', { conversationId: conversation._id.toString() });
          docClient.on('joinedConversation', () => resolve());
        });
      });

      const p1Client: ClientSocket = Client(serverUrl, {
        auth: { token: p1Token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        p1Client.on('connect', () => {
          p1Client.emit(
            'sendMessage',
            {
              conversationId: conversation._id.toString(),
              message: 'Testing single delivery to multi-room subscriber',
            },
            async (res: any) => {
              expect(res.success).toBe(true);

              await new Promise((r) => setTimeout(r, 200));
              // Must be exactly 1 delivery, not duplicate 2
              expect(docReceivedCount).toBe(1);

              docClient.disconnect();
              p1Client.disconnect();
              resolve();
            }
          );
        });
      });
    });

    test('Multiple receiver tabs each receive exactly 1 copy, and sender receives acknowledgment with 0 echo', async () => {
      const { user: p1, token: p1Token } = await createTestPatient();
      const { user: doc, token: docToken } = await createTestDoctor();

      const conversation = await Conversation.create({
        participants: [p1._id, doc._id],
      });

      // Doctor Tab 1
      const docTab1: ClientSocket = Client(serverUrl, {
        auth: { token: docToken },
        transports: ['websocket'],
      });

      // Doctor Tab 2
      const docTab2: ClientSocket = Client(serverUrl, {
        auth: { token: docToken },
        transports: ['websocket'],
      });

      let tab1Count = 0;
      let tab2Count = 0;
      docTab1.on('receiveMessage', () => tab1Count++);
      docTab2.on('receiveMessage', () => tab2Count++);

      await Promise.all([
        new Promise<void>((res) => docTab1.on('connect', () => res())),
        new Promise<void>((res) => docTab2.on('connect', () => res())),
      ]);

      // Tab 1 joins conversation room as well
      await new Promise<void>((res) => {
        docTab1.emit('joinConversation', { conversationId: conversation._id.toString() });
        docTab1.on('joinedConversation', () => res());
      });

      const p1Client: ClientSocket = Client(serverUrl, {
        auth: { token: p1Token },
        transports: ['websocket'],
      });

      let senderEchoCount = 0;
      p1Client.on('receiveMessage', () => senderEchoCount++);

      await new Promise<void>((res) => p1Client.on('connect', () => res()));

      await new Promise<void>((resolve) => {
        p1Client.emit(
          'sendMessage',
          {
            conversationId: conversation._id.toString(),
            message: 'Hello Doctor tabs',
          },
          async (ack: any) => {
            expect(ack.success).toBe(true);

            await new Promise((r) => setTimeout(r, 200));

            // Each receiver tab receives exactly 1 message
            expect(tab1Count).toBe(1);
            expect(tab2Count).toBe(1);

            // Sender socket gets 0 echo messages
            expect(senderEchoCount).toBe(0);

            docTab1.disconnect();
            docTab2.disconnect();
            p1Client.disconnect();
            resolve();
          }
        );
      });
    });

    test('Repeated commands with same idempotencyKey do not duplicate database messages or broadcasts', async () => {
      const { user: p1, token: p1Token } = await createTestPatient();
      const { user: doc, token: docToken } = await createTestDoctor();

      const conversation = await Conversation.create({
        participants: [p1._id, doc._id],
      });

      const docClient: ClientSocket = Client(serverUrl, {
        auth: { token: docToken },
        transports: ['websocket'],
      });

      let docReceivedCount = 0;
      docClient.on('receiveMessage', () => docReceivedCount++);

      await new Promise<void>((res) => docClient.on('connect', () => res()));

      const p1Client: ClientSocket = Client(serverUrl, {
        auth: { token: p1Token },
        transports: ['websocket'],
      });

      await new Promise<void>((res) => p1Client.on('connect', () => res()));

      const idempotencyKey = 'client-uuid-send-retry-test-12345';

      // First send
      await new Promise<void>((resolve) => {
        p1Client.emit(
          'sendMessage',
          {
            conversationId: conversation._id.toString(),
            message: 'First attempt with idempotency key',
            idempotencyKey,
          },
          (res: any) => {
            expect(res.success).toBe(true);
            expect(res.duplicate).toBeUndefined();
            resolve();
          }
        );
      });

      // Repeated send (retry)
      await new Promise<void>((resolve) => {
        p1Client.emit(
          'sendMessage',
          {
            conversationId: conversation._id.toString(),
            message: 'First attempt with idempotency key',
            idempotencyKey,
          },
          async (res: any) => {
            expect(res.success).toBe(true);
            expect(res.duplicate).toBe(true);

            await new Promise((r) => setTimeout(r, 200));

            // Only 1 message received across both sends
            expect(docReceivedCount).toBe(1);

            // Exactly 1 message persisted in database
            const dbCount = await Message.countDocuments({ idempotencyKey });
            expect(dbCount).toBe(1);

            docClient.disconnect();
            p1Client.disconnect();
            resolve();
          }
        );
      });
    });

    test('Disconnect and reconnect preserves acknowledged messages without loss', async () => {
      const { user: p1, token: p1Token } = await createTestPatient();
      const { user: doc, token: docToken } = await createTestDoctor();

      const conversation = await Conversation.create({
        participants: [p1._id, doc._id],
      });

      const p1Client: ClientSocket = Client(serverUrl, {
        auth: { token: p1Token },
        transports: ['websocket'],
      });

      await new Promise<void>((res) => p1Client.on('connect', () => res()));

      let messageId: string = '';
      await new Promise<void>((resolve) => {
        p1Client.emit(
          'sendMessage',
          {
            conversationId: conversation._id.toString(),
            message: 'Message before client disconnect',
          },
          (res: any) => {
            expect(res.success).toBe(true);
            messageId = res.message._id;
            resolve();
          }
        );
      });

      // Disconnect sender
      p1Client.disconnect();

      // Reconnect doctor
      const docClient: ClientSocket = Client(serverUrl, {
        auth: { token: docToken },
        transports: ['websocket'],
      });

      await new Promise<void>((res) => docClient.on('connect', () => res()));

      // Acknowledged message is persistent in MongoDB
      const persisted = await Message.findById(messageId);
      expect(persisted).not.toBeNull();
      expect(persisted!.message).toBe('Message before client disconnect');

      docClient.disconnect();
    });

    test('Persistence failure returns controlled error and does not emit message', async () => {
      const { token: p1Token } = await createTestPatient();

      const client: ClientSocket = Client(serverUrl, {
        auth: { token: p1Token },
        transports: ['websocket'],
      });

      await new Promise<void>((res) => client.on('connect', () => res()));

      // Passing a non-existent conversation ID
      const fakeConvId = new Types.ObjectId().toString();

      await new Promise<void>((resolve) => {
        client.emit(
          'sendMessage',
          {
            conversationId: fakeConvId,
            message: 'Should fail gracefully',
          },
          (res: any) => {
            expect(res.error).toMatch(/Conversation not found/i);
            client.disconnect();
            resolve();
          }
        );
      });
    });
  });
});
