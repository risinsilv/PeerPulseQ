 
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '../Home/Home'
import Send from '../Send/Send'
import Receive from '../Receive/Receive'
import About from '../About/About'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/send" element={<Send />} />
        <Route path="/receive" element={<Receive />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
