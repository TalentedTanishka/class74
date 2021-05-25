import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet,TextInput,KeyboardAvoidingView,Image,ToastAndroid } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config.js';

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
      studentscanneddata:'',
      bookidscanneddata:'',
        buttonState: 'normal',
        transactionMessage:''
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
     const {buttonState}=this.state
     if(buttonState==="bookid")
     {
       this.setState({
         scanned:true,
         bookidscanneddata:data,
         buttonState:'normal'
       })
     }
     else if(buttonState==="studentid")
     {
      this.setState({
        scanned:true,
       studentscanneddata:data,
        buttonState:'normal'
      })
     }
    }

    initiateBookIssue=async()=>{
        db.collection("transactions").add({"studentid":this.state.studentscanneddata,
        "bookid":this.state.bookidscanneddata,
        "date":firebase.firestore.Timestamp.now().toDate(),
        "transactiontype":"Issue"})

        db.collection("books").doc(this.state.bookidscanneddata).update({
            "bookAvailability":false
        })
        db.collection("students").doc(this.state.studentscanneddata).update({
            "noofbookissue":firebase.firestore.FieldValue.increment(1)
        })

        this.setState({
          studentscanneddata : '',
          bookidscanneddata: ''
        })
    }

    initiateBookReturn=async()=>{
        db.collection("transactions").add({"studentid":this.state.studentscanneddata,
        "bookid":this.state.bookidscanneddata,
        "date":firebase.firestore.Timestamp.now().toDate(),
        "transactiontype":"Return"})

        db.collection("books").doc(this.state.bookidscanneddata).update({
            "bookAvailability":true
        })
        db.collection("students").doc(this.state.studentscanneddata).update({
            "noofbookissue":firebase.firestore.FieldValue.increment(-1)
        })

        this.setState({
          studentscanneddata : '',
          bookidscanneddata: ''
        })
    }

    handleTransaction=async()=>{
      var transactionMessage = null;
      var transactionType = await this.cheakBookEligibility()
      console.log(transactionType)
      if(!transactionType)
      {
        alert("The book does not exsists in library database")
        this.setState({
          studentscanneddata:'',
          bookidscanneddata:''
        })
      }
    else if(transactionType === "issue")
      {
        var isStudentEligible = await this.cheakStudentBookEligibilityforBookIssue()

        if(isStudentEligible)
        {
          this.initiateBookIssue();
          alert("Book issued to the student");
        }
      }  

     else if(transactionType === "return")
      {
        var isStudentEligible = await this.cheakStudentBookEligibilityforBookReturn()

        if(isStudentEligible)
        {
          this.initiateBookReturn();
          alert("Book returned by the student");
        }
      } 
     
     
     
    }
    cheakBookEligibility=async()=>{
      var transactionType = ""
      var ref = await db.collection("books").where("bookId","==",this.state.bookidscanneddata).get()
      if(ref.docs.length===0)
      {
        transactionType = false
      }
      else 
      {
        ref.docs.map(data=>{
          var book = data.data();
          if(book.bookAvailability)
          {
            transactionType = "issue"
          }
          else
          {
            transactionType = "return"
          }
        })
        
      }
      return transactionType
    }

    cheakStudentBookEligibilityforBookIssue=async()=>{
      console.log("inside")
      var isStudentEligible = ''
      const ref= await db.collection("students").where('studentid','==',this.state.studentscanneddata).get()
      console.log(ref)
      if(ref.docs.length===0)
      {
        isStudentEligible = false
        alert("Student does not exisits in the database")
        this.setState({
          studentscanneddata:'',
          bookidscanneddata:''
        })
      }
      else
      {
        ref.docs.map((doc)=>{
          var student = doc.data()
          if(student.noofbookissue<2)
          {
            isStudentEligible = true
          }
          else
          {
            isStudentEligible = false
          alert("Student alredy issued 2 books") 
          this.setState({
            bookidscanneddata : '',
            studentscanneddata:''
          })         
        }
        })
      }
      return isStudentEligible
    }

    cheakStudentBookEligibilityforBookReturn=async()=>
    {
      var isStudentEligible = ''
      const ref = await db.collection('transactions').where("bookid","==",this.state.bookidscanneddata).limit(1).get()
      ref.docs.map((doc)=>{
        var lastTransaction = doc.data()

        if(lastTransaction.studentid === this.state.studentscanneddata)
        {
          isStudentEligible = true
        }
        else{
          isStudentEligible = false
          alert("The book was not issued this student")
          this.setState({
            studentscanneddata:'',
            bookidscanneddata:''
          })
        }
      })
      return isStudentEligible
    }




   

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
          <View>
            <Image
              source = {require("../assets/booklogo.jpg")}
              style= {{width:200, height:200}}/>
            <Text style={{textAlign:'center', fontSize:30,}}>Wily</Text>
          </View>
          <View style={styles.inputView}>
          <TextInput
            style={styles.inputBox}
            placeholder="Book Id" 
            onChangeText={text =>this.setState({bookidscanneddata:text})}
            value={this.state.bookidscanneddata}/>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={()=>{
              this.getCameraPermissions("BookId")
            }}>
            <Text style={styles.buttonText}>Scan</Text>
          </TouchableOpacity>
          </View>
  
          <View style={styles.inputView}>
          <TextInput
            style={styles.inputBox}
            placeholder="Student Id" 
            onChangeText={text =>this.setState({studentscanneddata:text})}
            value={this.state.studentscanneddata}/>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={()=>{
              this.getCameraPermissions("StudentId")
            }}>
            <Text style={styles.buttonText}>Scan</Text>
          </TouchableOpacity>
          </View>
          <Text style={styles.transactionAlert}>{this.state.transactionMessage}</Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={async()=>{
              var transactionMessage = await this.handleTransaction();
            }}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
        )
      }
    }
  }
  
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: 'violet',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitButton:{
      backgroundColor: 'pink',
      width: 100,
      height:50
    },
    submitButtonText:{
      padding: 10,
      textAlign: 'center',
      fontSize: 20,
      fontWeight:"bold",
      color: 'white'
    }
  });