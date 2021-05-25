import firebase from 'firebase' 
require('@firebase/firestore')
  var firebaseConfig = {
    apiKey: "AIzaSyCgprpI1myv23fFhlrXO-tmubvGr26Hlz4",
    authDomain: "willy-e874f.firebaseapp.com",
    databaseURL:"https://willy-e874f.firebaseio.com",
    projectId: "willy-e874f",
    storageBucket: "willy-e874f.appspot.com",
    messagingSenderId: "178902697862",
    appId: "1:178902697862:web:74f376462233f586dc0e07"
  };
  // Initialize Firebase
  if(!firebase.apps.length)
  firebase.initializeApp(firebaseConfig);

  export default firebase.firestore();