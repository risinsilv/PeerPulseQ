import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '../Home/Home'
import Send from '../Send/Send'
import Receive from '../Receive/Receive'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/send" element={<Send />} />
        <Route path="/receive" element={<Receive />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
