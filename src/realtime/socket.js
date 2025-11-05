'use strict';

const { Server } = require('socket.io');
const config = require('../config');
const { verify } = require('../utils/jwt');
const { addOnline, removeOnline } = require('../services/presence');
const { Conversation, Message } = require('../models');
const { addMessage } = require('../services/cache');
const { Types } = require('mongoose');
const { setIO } = require('./io');
const search = require('../services/search');

function setup(server) {
  const io = new Server(server, { cors: { origin: true, credentials: true } });
  setIO(io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token ? socket.handshake.auth.token : socket.handshake.query && socket.handshake.query.token ? socket.handshake.query.token : null;
      if (!token) return next(new Error('UNAUTHORIZED'));
      const payload = verify(token, config.jwt.accessSecret);
      socket.userId = String(payload.sub);
      next();
    } catch (e) {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', async (socket) => {
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);
    await addOnline(socket.userId);
    socket.broadcast.emit('user_online', { userId: socket.userId, online: true });

    socket.on('join_room', async (payload, cb) => {
      try {
        const id = payload && payload.conversationId ? String(payload.conversationId) : null;
        if (!id || !Types.ObjectId.isValid(id)) return cb && cb({ ok: false, error: 'INVALID_ID' });
        const conv = await Conversation.findOne({ _id: id, participants: new Types.ObjectId(socket.userId), isDeleted: false });
        if (!conv) return cb && cb({ ok: false, error: 'FORBIDDEN' });
        const room = `conversation:${id}`;
        socket.join(room);
        return cb && cb({ ok: true });
      } catch (e) {
        return cb && cb({ ok: false, error: 'ERROR' });
      }
    });

    socket.on('typing', async (payload) => {
      try {
        const id = payload && payload.conversationId ? String(payload.conversationId) : null;
        const isTyping = !!(payload && payload.isTyping);
        if (!id || !Types.ObjectId.isValid(id)) return;
        const room = `conversation:${id}`;
        socket.to(room).emit('typing', { conversationId: id, userId: socket.userId, isTyping });
      } catch {}
    });

    socket.on('send_message', async (payload, cb) => {
      try {
        const content = payload && payload.content ? String(payload.content).trim() : '';
        const conversationId = payload && payload.conversationId ? String(payload.conversationId) : null;
        const toUserId = payload && payload.toUserId ? String(payload.toUserId) : null;
        if (!content) return cb && cb({ ok: false, error: 'INVALID_CONTENT' });
        let convId = null;
        if (conversationId) {
          if (!Types.ObjectId.isValid(conversationId)) return cb && cb({ ok: false, error: 'INVALID_CONVERSATION_ID' });
          const conv = await Conversation.findOne({ _id: conversationId, participants: new Types.ObjectId(socket.userId), isDeleted: false });
          if (!conv) return cb && cb({ ok: false, error: 'FORBIDDEN' });
          convId = conv._id;
        } else if (toUserId) {
          if (!Types.ObjectId.isValid(toUserId)) return cb && cb({ ok: false, error: 'INVALID_TO_USER_ID' });
          const other = new Types.ObjectId(toUserId);
          let conv = await Conversation.findOne({ type: 'direct', participants: { $all: [new Types.ObjectId(socket.userId), other] }, isDeleted: false });
          if (!conv) conv = await Conversation.create({ participants: [new Types.ObjectId(socket.userId), other], type: 'direct' });
          convId = conv._id;
        } else {
          return cb && cb({ ok: false, error: 'MISSING_TARGET' });
        }
        const msg = await Message.create({ conversationId: convId, senderId: new Types.ObjectId(socket.userId), content, status: 'sent' });
        await Conversation.findByIdAndUpdate(convId, { lastMessageAt: msg.createdAt, updatedAt: new Date() });
        await addMessage(convId, msg.toJSON());
        try { await search.indexMessage(msg.toJSON()); } catch {}
        const room = `conversation:${String(convId)}`;
        io.to(room).emit('message_received', msg.toJSON());
        cb && cb({ ok: true, data: msg.toJSON() });
      } catch (e) {
        cb && cb({ ok: false, error: 'ERROR' });
      }
    });

    socket.on('disconnect', async () => {
      await removeOnline(socket.userId);
      socket.broadcast.emit('user_online', { userId: socket.userId, online: false });
    });
  });

  return io;
}

module.exports = { setup };
