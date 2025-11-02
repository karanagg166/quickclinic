import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from '../component/home/home';
import Login from '../component/users/login/login';
import Signup from '../component/users/signup/signup';
import Forgot from '../component/users/login/forgot';
import UpdateUserInfo from '../component/users/update/update';
import UserInfoPage from '../component/users/info/UserInfoPage';
import ChatViewPage from '../component/chats/chatview';
import ChatPage from '../component/chats/messages/chats';
import About from '../component/users/about/about';
import TestComponent from '../component/common/TestComponent';

const UserRoutes: React.FC = () => (
  <>
    <Routes>
      <Route path='/home' element={<Home />} />
      <Route path='/test' element={<TestComponent />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Signup />} />
      <Route path='/forgot' element={<Forgot />} />
      <Route path='/:id/update' element={<UpdateUserInfo />} />
      <Route path='/:id/info' element={<UserInfoPage />} />
      <Route path='/:id/chats' element={<ChatViewPage />} />
      <Route path='/chats/:conversationId' element={<ChatPage />} />
      <Route path='/about' element={<About />} />
    </Routes>
  </>
);

export default UserRoutes;
