import React from 'react';
import { Text, View,ScrollView } from 'react-native';
import db from '../config'
export default class Searchscreen extends React.Component {

  constructor(props){
    super(props)

    this.state={
      allTransactions:[]
    }
  }

  componentDidMount=async()=>{
    const ref = await db.collection("transactions").get();

    ref.docs.map(doc=>{
      this.setState({
        allTransactions:[...this.state.allTransactions,doc.data()]
      })
      console.log("data",this.state.allTransactions)
    })
  }
    render() {
      return (
        <ScrollView>
          {this.state.allTransactions.map((iteam,index)=>{
            console.log(iteam)
           
           
            return
            (
             
              <View style={{borderBottomWidth : 2}} key={index}>
                <Text>
                  {iteam.transactiontype}
                </Text>
              </View>
            
            )
          }
         
          )
        }
        </ScrollView>
      );
    }
  }