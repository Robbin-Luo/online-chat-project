import React, { useRef, useState } from 'react'
import { useEffect } from 'react';
import socketIOClient from 'socket.io-client'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ListGroup from 'react-bootstrap/ListGroup'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'
import Button from 'react-bootstrap/Button'
import './AdminPage.css'

const ENDPOINT = window.location.host.indexOf('localhost') >= 0 ? 'http://192.168.0.103:3001' : window.location.host;

const AdminPage = () => {
  const [selectedUser, setSelectedUser] = useState({});
  const [socket, setSocket] = useState(null);
  const uiMessageRef = useRef(null);
  const [messageBody, setMessageBody] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (uiMessageRef.current) {
      uiMessageRef.current.scrollBy({ top: uiMessageRef.current.scrollHeight, left: 0, behavior: 'smooth' });
    };
    if (socket) {
      socket.on('message', data => {
        if (selectedUser.name === data.from) {
          setMessages([...messages, data]);
        } else {
          const exsitUser = users.find((u)=> u.name === data.from);
          if (exsitUser) {
            setUsers(users.map((user) => user.name === exsitUser.name ? { ...user, unread: true } : user))
          }
        }
      });
      socket.on('updateUser', updatedUser => {
        const exsitUser = users.find((user) => user.name === updatedUser.name);
        if (exsitUser) {
          setUsers(users.map((user)=> user.name === exsitUser.name ? updatedUser : user))
        } else {
          setUsers([...users, updatedUser]);
        }
      });
      socket.on('listUsers', updatedUsers => {
        setUsers(updatedUsers);
      });
      socket.on('selectUser', user => {
        setMessages(user.messages);
      });
    } else {
      const sk = socketIOClient(ENDPOINT);
      setSocket(sk);
      sk.emit('onLogin', {
        name: 'Admin',
      });
    }
  }, [messages, selectedUser, socket, users])

  const selectUser = (user) => {
    setSelectedUser(user);
    const exsitUser = users.find(u => u.name === user.name);
    if (exsitUser) {
      setUsers(
        users.map(user => user.name === exsitUser.name ? { ...user, unread: false } : user)
      )
    }
    socket.emit('onUserSelected', user);
  }

  const submitHandler = e => {
    e.preventDefault();
    if (!messageBody.trim()) {
      alert('you cannot send an empty message')
    } else {
      setMessages([...messages, { body: messageBody, from: 'Admin', to: selectedUser.name }]);
      setTimeout(() => {
        socket.emit('onMessage', { body: messageBody, from: 'Admin', to: selectedUser.name })
      }, 1000)
    }
    setMessageBody('');
  }

  return (
    <Row>
      <Col sm={3}>
        {users.filter(user => user.name !== 'Admin').length === 0 && (<Alert variant='info'>No user found</Alert>)}
        <ListGroup>
          {users.filter(user => user.name !== 'Admin').map((user, index) => 
                    <ListGroup.Item action key={index} variant={user.name === selectedUser.name ? 'info' : ''} onClick={() => selectUser(user)}>
                      <Badge bg={selectedUser.name === user.name ? user.online ? 'primary' : 'secondary' : user.unread ? 'danger' : user.online ? 'primary' : 'secondary'}>
                      {selectedUser.name === user.name ? user.online ? "online" : 'offline' : user.unread ? 'new' : user.online ? 'online' : 'offline'}
                      </Badge>&nbsp;
                      {user.name}
                    </ListGroup.Item>
          )}
        </ListGroup>
      </Col>
      <Col sm={9}>
        <div className='admin'>
          {
            !selectedUser.name ? <Alert variant='info'>select a user to start chat</Alert> :
              <div>
                <h2>chatting with {selectedUser.name}</h2>
                <ListGroup ref={uiMessageRef}>
                  {messages.length === 0 && (
                    <ListGroup.Item>no message</ListGroup.Item>
                  )}
                  {messages.map((msg, index) => {
                    return <ListGroup.Item key={index}>
                      <strong>{`${msg.from}: `}</strong>{msg.body}
                    </ListGroup.Item>
                  })}
                </ListGroup>
                <div>
                  <form onSubmit={submitHandler}>
                    <InputGroup className='col-6'>
                      <FormControl value={messageBody} onChange={e => setMessageBody(e.target.value)} type='text' placeholder='type in message here' ></FormControl>
                      <Button type='submit' variant='primary'>send</Button>
                    </InputGroup>
                  </form>
                </div>
              </div>
          }
        </div>
      </Col>
    </Row>
  )
}

export default AdminPage