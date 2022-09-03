import React, { useState, useRef, useEffect } from 'react'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ListGroup from 'react-bootstrap/ListGroup'
import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'
import socketIOClient from 'socket.io-client'
import './ChatBox.css'

const ENDPOINT=window.location.host.indexOf('localhost')>=0?'http://192.168.0.103:3001':window.location.host;

const ChatBox = () => {
  const uiMessageRef=useRef(null);

  const [userName, setUserName]=useState('');
  const [messages, setMessages]=useState([{from:'System', body:'hi there, please ask your question'}]);
  const [socket, setSocket]=useState(null);            
  const [isOpen, setIsOpen] = useState(false);
  const [messageBody, setMessageBody]=useState('')

  useEffect(()=>{
    if(uiMessageRef.current){
      uiMessageRef.current.scrollBy({
        top:uiMessageRef.current.scrollHeight,
        lefy:0,
        behavior:'smooth',
      })
    }
    if(socket){
      socket.emit('onLogin', {name:userName});
      socket.on('message', data=>{
        setMessages([...messages, data]);
      })
    }
  },[messages, socket, userName]);

  const supportHandler = () => {
    setIsOpen(true);
    if(!userName){
      setUserName(prompt('please enter your name'));
    }
    const sk=socketIOClient(ENDPOINT);
    setSocket(sk);
  }
  const closeHandler = () => {
    setIsOpen(false);
  }
  const submitHandler=(e)=>{
    e.preventDefault();
    if(messageBody.trim()===''){
      alert('You cannot send a empty message')
    } else{
      setMessages([...messages,{body:messageBody, from:userName, to:'Admin'}]);
      setTimeout(()=>{
        socket.emit('onMessage', {body:messageBody, from:userName, to:'Admin'});
      },1000)
      setMessageBody('');
    }
  }

  return (
    <div className='chatbox'>
      {
        !isOpen ?
          <Button variant='primary' onClick={supportHandler}>
            Chat with us
          </Button> :
          <Card>
            <Card.Body>
              <Row>
                <Col>
                  <strong>Support</strong>
                </Col>
                <Col className='text-end'>
                  <Button className='btn-sm btn-secondary' onClick={closeHandler}>x</Button>
                </Col>
              </Row>
              <hr />
              <ListGroup ref={uiMessageRef}>
                {messages.map((message, index)=>
                          <ListGroup.Item key={index}>
                            <strong>{`${message.from}: `}</strong>{message.body}
                          </ListGroup.Item>
                )}
              </ListGroup>
              <form onSubmit={submitHandler}>
                <InputGroup className='col-6'>
                  <FormControl value={messageBody} onChange={e=>setMessageBody(e.target.value)} type='text' placeholder='type in message here' ></FormControl>
                  <Button type='submit' variant='primary'>send</Button>
                </InputGroup>
              </form>
            </Card.Body>
          </Card>

      }
    </div>
  )
}

export default ChatBox