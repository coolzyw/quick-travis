import React, { useState, useEffect} from 'react';
import "rbx/index.css";
import { Container, Title, Message, Button } from 'rbx';
import CourseList from './components/CourseList';
import firebase from './shared/firebase.js'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';

const db = firebase.database().ref();

const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false
  }
};

const meetsPat = /^ *((?:M|Tu|W|Th|F)+) +(\d\d?):(\d\d) *[ -] *(\d\d?):(\d\d) *$/;

const Banner = ({ user, title }) => (
    <React.Fragment>
      { user ? <Welcome user={ user } /> : <SignIn /> }
      <Title>{ title || '[loading...]' }</Title>
    </React.Fragment>
);

const timeParts = meets => {
  const [match, days, hh1, mm1, hh2, mm2] = meetsPat.exec(meets) || [];
  return !match ? {} : {
    days,
    hours: {
      start: hh1 * 60 + mm1 * 1,
      end: hh2 * 60 + mm2 * 1
    }
  };
};

const SignIn = () => (
    <StyledFirebaseAuth
        uiConfig={uiConfig}
        firebaseAuth={firebase.auth()}
    />
);

const Welcome = ({ user }) => (
    <Message color="info">
      <Message.Header>
        Welcome, {user.displayName}
        <Button primary onClick={() => firebase.auth().signOut()}>
          Log out
        </Button>
      </Message.Header>
    </Message>
);


const addCourseTimes = course => ({
  ...course,
  ...timeParts(course.meets)
});

const addScheduleTimes = schedule => ({
  title: schedule.title,
  courses: Object.values(schedule.courses).map(addCourseTimes)
});

const App = () => {
  const [schedule, setSchedule] = useState({ title: '', courses: [] });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleData = snap => {
      if (snap.val()) setSchedule(addScheduleTimes(snap.val()));
    };
    db.on('value', handleData, error => alert(error));
    return () => { db.off('value', handleData); };
  }, []);

  useEffect(() => {
    firebase.auth().onAuthStateChanged(setUser);
  }, []);

  return (
    <Container>
      <Banner title={ schedule.title } user={ user } />
      <CourseList courses={ schedule.courses } />
    </Container>
  );
};

export default App;
