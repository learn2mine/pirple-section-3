/*
* Request handlers
*
*/

// Dependencies
var _data = require('./data');
var helpers = require("./helpers");

// Define the handlers
var handlers ={};

// users
handlers.users = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  };
};

// Container for the users submethods
// Required data: firstName lastName, phone, password, tosAgreement
// Optional data: none
handlers._users = {};

// Users -post
handlers._users.post = function(data,callback){
  // Check that all required fields are filed
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;
  if(firstName && lastName && phone && password && tosAgreement){
    // Make sure that the user doesnt already exist
    _data.read('users',phone,function(err,data){
      if (err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

        // Store the user
        _data.create('users',phone,userObject,function(err){
          if(!err){
            callback(200);
          } else {
            console.log(err);
            callback(500,{'Error' : 'Could not create the new user'});
          };
        });
      } else {
        callback(500,{'Error' : 'Could not hash the password'});
      }

    } else {
      // User already exists
      callback(400,{'Error' : 'A user with that phone number already exists'});
    }
  });
  } else {
    callback(400,{'Error' : 'Missing requred fields'});
  }

};

// Users -get
// Requred data: Phone,
// Optional Data: none,
// @TODO only let authentiacated users access their own object Dont let them access anyone elses!
handlers._users.get = function(data,callback){
  // Check that the phone number provided is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() :false;
  if(phone){
    //Lookup the user
    _data.read('users',phone,function(err,data){
      if(!err && data){
        // Remove the hashed password from the user object before returning it the requester
        delete data.hashedPassword
        callback(200,data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'});
  }
};

// Users -put
// Required data : Phone
// Optional Data : firstName lastName password(at least one must be specified)
// @TODO Only let an authenticated user update their own object dont let them update anyone elses
handlers._users.put = function(data,callback){
  // Check for the required fields
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() :false;

  // Check for the optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the phone is invalid
  if(phone){
    //Error if nothing is sent to Update
    if(firstName || lastName || password) {
      // Lookup users
      _data.read('users',phone,function(err,userData){
        if(!err && userData) {
          // Update the fields that are neccessary
          if(firstName){
            userData.firstName = firstName;
          }
          if(firstName){
            userData.lastName = lastName;
          }
          if(firstName){
            userData.hashedPassword = helpers.hash(password);
          }
          //Store the new updates
          _data.update('users',phone,userData,function(err){
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not update the user'});
            }
          });
        } else {
          callback(400,{'Error' : 'The specified user does not not exist'});
        };
      });
    } else {
      callback(400,{'Error' : 'Missing fields to update'})
    };
  } else {
    callback(400,{'Error' : 'Missing required field'});
  };

};

// Users -delete
// Required field : Phone
//@TODO Only let an authenticated user delete their objcet (Donbt let them delete anyone elses!)
//@TODO Cleanup (delete) any other data files associated with this user!
handlers._users.delete = function(data,callback){
  // Check that phone number is valid
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() :false;
  if(phone){
    //Lookup the user
      _data.read('users',phone,function(err,data){
      if(!err && data){
        _data.delete('users',phone,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified user'})
          }
        });
      } else {
        callback(404, {'Error' : 'Could not find the specified user'});
      };
    });
  } else {
    callback(400,{'Error' : 'Missing required field'});
  };
};

// tokens
handlers.tokens = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  };
};



// Ping handler
handlers.ping = function(data,callback){
  callback(200);
};

// Not found handler
handlers.notFound = function(data,callback){
  callback(404);
};


// Export all of the handlers
module.exports = handlers;
