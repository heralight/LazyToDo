'use strict';
var styles = require('../styles/styles');
var React = require('react-native');
var ToDoList = require('./ToDoList');
var ToDoEdit = require('./ToDoEdit');
var MK = require('react-native-material-kit')
var _ = require('underscore')

var { Text, Image, View, ListView, TouchableHighlight, TouchableOpacity, AsyncStorage, AlertIOS, ToolbarAndroid, DrawerLayoutAndroid } = React;

const {
  MKButton,
  MKColor,
} = MK;

function dateReviver(key, value) {
  if (typeof value === 'string') {
    var a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
    if (a) {
      return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
    }
  }
  return value;
};

var selected

const ColoredFab = MKButton.coloredFab().withStyle(styles.fab).build();

const TODOLIST = "TODOLIST"




class ToDoContainer extends React.Component {

    componentDidMount() {
      this._loadInitialState().done();
    }

    async _loadInitialState() {
      try {
        console.log("Load initial State")
        var list = await AsyncStorage.getItem(TODOLIST);
        if (list !== null){
          list = JSON.parse(list, dateReviver)
          // list = this.getItems(list, this.props.title)
          this.setState({items: list});
          this._appendMessage('Recovered selection from disk: ' + list);
        } else {
          // this.setState({items: []});
          this._appendMessage('Initialized with no selection on disk.');
        }
      } catch (error) {
        this._appendMessage('AsyncStorage error: ' + error.message);
      }
    }


    _appendMessage(message) {
      this.setState({messages: this.state.messages.concat(message)});
    }

    async _onValueChange(items) {
      try {
        items = JSON.stringify(items)
        await AsyncStorage.setItem(TODOLIST, items);
        this._appendMessage('Saved selection to disk: ' + items);
      } catch (error) {
        this._appendMessage('AsyncStorage error: ' + error.message);
      }
    }


    constructor() {
        super();
        this.state = {
          items: [], //{txt: 'New Item', complete: false}
          messages: []
        }
        this.alertMenu = this.alertMenu.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
        this.updateItem = this.updateItem.bind(this);
        this.openItem = this.openItem.bind(this);

    }

    alertMenu(rowData, rowID) {
        AlertIOS.alert(
            'Quick Menu',
            null,
            [
                {text: 'Delete', onPress: () => this.deleteItem(rowID)},
                {text: 'Edit', onPress: () => this.openItem(rowData, rowID)},
                {text: 'Cancel'}
            ]
        )
    }

    deleteItem(index) {
        var items = this.state.items;
        items.splice(index, 1);
        this._onValueChange(items)
    }



    updateItem(item, index) {
        var items = this.state.items;
        if (index) {
          console.log("replacing")
          // console.log(items[index])
          index = _.findIndex(items, function(i){ return i.uuid === item.uuid})
          items[index] = item;
          console.log(items[index])

        }else {
          item.uuid = Date.now()
          items.push(item)
        }
        items.sort(function(a,b){
          return a.endDate - b.endDate;
        });
        // this.setState({items: items});
        var items_clone  = _.clone(items)
        // items_clone = this.getItems(items, this.props.title)
        this.setState({items: items_clone});
        this._onValueChange(items)
        this.props.navigator.pop();
    }

    clearData(){
      for (var i = 0; i < this.state.items.length; i++) {
        this.deleteItem(i)
      }
    }

    openItem(rowData, rowID) {
        this.props.navigator.push({
            title: rowData && rowData.txt || 'New Item',
            component: ToDoEdit,
            passProps: {navigator: this.props.navigator, item: rowData, id: rowID, update: this.updateItem}
        });
    }

    filterItems(i){
      if (i.startDate !== null && i.startDate !== undefined){
        return today >= i.startDate.roundedDay() && today <= i.endDate.roundedDay()
      }else{
        return true
      }
    }

    getItems(items, filter){
      // console.log(items)
      console.log("Get Items: "+filter)
      switch (filter){
        case "Today":
          var today = (new Date()).roundedDay()
          var filtered = _.filter(items, function(i){
            if (i.startDate !== null && i.startDate !== undefined){
              return today >= i.startDate.roundedDay() && today <= i.endDate.roundedDay() && !i.complete
            }else{
              return true
            }
          })
          return filtered
        case "All":
          var filtered = _.where(items, {complete: false})
          // console.log(filtered)
          return filtered
        case "Tomorrow":
          var today = (new Date()).addDays(1).roundedDay()
          var filtered = _.filter(items, function(i){
            if (i.startDate !== null && i.startDate !== undefined){
              return today >= i.startDate.roundedDay() && today <= i.endDate.roundedDay() && !i.complete
            }else{
              return true
            }
          })
          return filtered
        case "Completed":
          var filtered = _.where(items, {complete: true})
          // console.log(filtered)
          return filtered
      }
    }

    onActionSelected() {
      // _emitter.emit('openMenu')
      this.props.emitter.emit('openMenu')
    }


    render() {
        return (
          <View style={{flex: 1}}>
            <View style={{flex: 1}}>
              <ToolbarAndroid style={styles.navigator }
                navIcon={require('../images/ic_menu_white_24dp/web/ic_menu_white_24dp_1x.png')}
                titleColor='#FFFFFF'
                title={this.props.title}
                contentInsetStart={72}
                onIconClicked={this.onActionSelected.bind(this)}
              >

              </ToolbarAndroid>

              <View style={styles.scrollView}>
                    <ToDoList
                      items={this.getItems(this.state.items, this.props.title)}
                      onPressItem={this.openItem}
                      onLongPressItem={this.alertMenu}
                      style={styles.scrollView}
                    />
              </View>

            </View>
            <View style={styles.fabView}>
              <ColoredFab
              onPress={this.openItem}
              onLongPress={this.clearData.bind(this)}>
                <Image pointerEvents="none" source={require('../images/plus.png')} style={{height: 24, width: 24}}/>
              </ColoredFab>
            </View>
          </View>
        );
    }


}

// <TouchableHighlight
//     style={[styles.button, styles.newButton]}
//     underlayColor='#99d9f4'
//     onPress={this.openItem}>
//     <Text style={styles.buttonText}>+</Text>
// </TouchableHighlight>




module.exports = ToDoContainer;
