import http from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../backend/app';
import { setupSocket } from '../backend/socket';
import Conversation from '../backend/models/conversationmodel';
import Message from '../backend/models/messagemodel';
import {
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createTestPatient,
  createTestDoctor,
  generateTestToken,
} from './helpers/setup';

describe('Realtime Socket.IO Authentication, Rooms, & Persistence', () => {
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

  test('Socket connection rejects handshake when token is invalid', (done) => {
    const client: ClientSocket = Client(serverUrl, {
      auth: { token: 'invalid_token_123' },
      transports: ['websocket'],
      autoConnect: true,
    });

    client.on('connect_error', (err) => {
      expect(err.message).toMatch(/Authentication error/i);
      client.disconnect();
      done();
    });
  });

  test('Socket connection succeeds with valid JWT and joins personal user room', (done) => {
    createTestPatient().then(({ user, token }) => {
      const client: ClientSocket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        done();
      });
    });
  });

  test('Rejects unauthorized user from joining conversation room', async () => {
    const { user: patient1, token: token1 } = await createTestPatient();
    const { user: patient2, token: token2 } = await createTestPatient();
    const { user: doctorUser } = await createTestDoctor();

    // Conversation between patient1 and doctor
    const conversation = await Conversation.create({
      participants: [patient1._id, doctorUser._id],
    });

    // Patient 2 (not participant) connects and tries to join conversation room
    const client: ClientSocket = Client(serverUrl, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      client.on('connect', () => {
        client.emit('joinConversation', { conversationId: conversation._id.toString() });
      });

      client.on('error', (err: any) => {
        expect(err.message).toMatch(/Not authorized to join this conversation/i);
        client.disconnect();
        resolve();
      });
    });
  });

  test('Allows participant to join room, persists message to DB, and delivers via room', async () => {
    const { user: patientUser, token: patientToken } = await createTestPatient();
    const { user: doctorUser, token: doctorToken } = await createTestDoctor();

    const conversation = await Conversation.create({
      participants: [patientUser._id, doctorUser._id],
    });

    const patientClient: ClientSocket = Client(serverUrl, {
      auth: { token: patientToken },
      transports: ['websocket'],
    });

    const doctorClient: ClientSocket = Client(serverUrl, {
      auth: { token: doctorToken },
      transports: ['websocket'],
    });

    // Both connect and join room
    await Promise.all([
      new Promise<void>((resolve) => {
        patientClient.on('connect', () => {
          patientClient.emit('joinConversation', { conversationId: conversation._id.toString() });
          patientClient.on('joinedConversation', () => resolve());
        });
      }),
      new Promise<void>((resolve) => {
        doctorClient.on('connect', () => {
          doctorClient.emit('joinConversation', { conversationId: conversation._id.toString() });
          doctorClient.on('joinedConversation', () => resolve());
        });
      }),
    ]);

    // Patient sends message
    const testMessageText = 'Hello Doctor, I have a question regarding my appointment.';

    const messageReceivedPromise = new Promise<void>((resolve) => {
      doctorClient.on('receiveMessage', async (msg: any) => {
        expect(msg.message).toBe(testMessageText);
        expect(msg.conversationId.toString()).toBe(conversation._id.toString());

        // Verify message was persisted in MongoDB
        const inDb = await Message.findById(msg._id);
        expect(inDb).not.toBeNull();
        expect(inDb!.message).toBe(testMessageText);

        patientClient.disconnect();
        doctorClient.disconnect();
        resolve();
      });
    });

    patientClient.emit('sendMessage', {
      conversationId: conversation._id.toString(),
      message: testMessageText,
    });

    await messageReceivedPromise;
  });
});
