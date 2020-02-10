// ------Sign UP
exports.signup = function(req, res){
   message = '';
   if(req.method == "POST"){
      var post  = req.body;
      var name= post.user_name;
      var pass= post.password;
      var fname= post.first_name;
      var lname= post.last_name;
      var email= post.email;
      var sql = "INSERT INTO `user`(`firstName`,`lastName`,`email`,`userName`, `password`) VALUES ('" + fname + "','" + lname + "','" + email + "','" + name + "','" + pass + "')";
      var query = db.query(sql, function(err, result) {
         message = "Succesfully! Your account has been created.";
         res.render('signup.ejs',{message: message});
      });
   } else {
      res.render('signup');
   }
};
 
//-----------------------------------------------login page call------------------------------------------------------
exports.login = function(req, res){
   var message = '';
   var sess = req.session; 
   if(req.method == "POST"){
      var post  = req.body;
      var name= post.user_name;
      var pass= post.password;
      var sql="SELECT userId, firstName, lastName, userName FROM `user` WHERE `userName`='"+name+"' and password = '"+pass+"'";                           
      db.query(sql, function(err, results){      
         if(results.length){
            req.session.userId = results[0].userId;
            req.session.user = results[0];
            console.log(results[0].userId);
            res.redirect('/home/dashboard');
           
         }
         
         else{
            message = 'Wrong Credentials.';
            res.render('index.ejs',{message: message});
         }
                 
      });
   } else {
      res.render('index.ejs',{message: message});
   }
           
};
//-----------------------------------------------dashboard page functionality----------------------------------------------
exports.dashboard = function(req, res, next){
   var user =  req.session.user,
   userId = req.session.userId;
   console.log('ddd='+userId);
   if(userId == null){
      res.redirect("/login");
      return;
   }
   var sql="SELECT * FROM `user` WHERE `userId`='"+userId+"'";
   db.query(sql, function(err, results){
      res.render('dashboard.ejs', {user:user});    
   });       
};
//------------------------------------logout functionality----------------------------------------------
exports.logout=function(req,res){
   req.session.destroy(function(err) {
      res.redirect("/login");
   })
};

// -------------RENDER UDSER PROFILE AND USER NOTES
exports.profile = function(req, res){
   if(req.method == "GET")
   {
      var userId = req.session.userId;
      if(userId == null){
         res.redirect("/login");
         return;
      }
      var cDatetime = new Date().toISOString().slice(0,19).replace('T','');
      var cDate = cDatetime.slice(0,10);
      var cTime = cDatetime.slice(10,18);

      var sql="SELECT * FROM `user` WHERE `userId`='"+userId+"'";         
      var sqlnotes= "SELECT categories.categoryName, notes.noteId, notes.title, notes.content, notes.date FROM categories INNER JOIN notes ON categories.categoryId = notes.categoryId_Fk WHERE notes.userId_Fk = '"+userId+"' ORDER BY notes.noteId DESC";
      var sqlSelectSharedNotes = "SELECT DISTINCT subscribed_user_notes.noteId, notes.date=?, notes.title, notes.content, notes.categoryId_Fk, categories.categoryName, user.userName FROM subscribed_user_notes INNER JOIN notes ON	notes.noteId = subscribed_user_notes.noteId INNER JOIN categories ON notes.categoryId_Fk = categories.categoryId INNER JOIN user ON	user.userId = notes.userId_Fk WHERE subscribed_user_notes.userId= '"+userId+"' ORDER BY notes.noteId DESC";
      db.query(sql, function(err, result){ 
         db.query(sqlnotes, function(err, resultat){  
            db.query(sqlSelectSharedNotes, [cDate] , function(err, sharedNotes){ 
               console.log({data : result, notes: resultat});
               res.render('profile.ejs',{data : result, notes: resultat, sharedNotes: sharedNotes});
            });
         });
      });
   }
   
};

// ------------SHOW SINGLE NOTE
exports.note = function(req, res){
   
   if(req.method === "PUT")
   {
      console.log('we start a put request');
      var post = req.body;
      var title = post.title;
      var content = post.content;
      var categoryId = post.categoryId;
      var shareUserIdAndName = post.shareUserId;
      var shareUserIdAndNameArray = shareUserIdAndName.split('~');
      var shareUserId = shareUserIdAndNameArray[0];
      var shareUserName = shareUserIdAndNameArray[1];
      var noteId = req.session.noteId;
      var userId = req.session.userId;
      console.log(shareUserId + shareUserName);

      var sqlnotesUpdate= "UPDATE notes SET title=? , content=?  , categoryId_Fk=? WHERE noteId=?"; 
      var sqlnotesSelect= "SELECT categories.categoryId, categories.categoryName, notes.noteId, notes.title, notes.content, notes.date FROM categories INNER JOIN notes ON categories.categoryId = notes.categoryId_Fk WHERE  notes.noteId = '"+noteId+"'";
      var sqlSelectUsers= "SELECT * FROM user WHERE userId !='"+userId+"'";
      var sqlShareUsers= "INSERT INTO `subscribed_user_notes` (`userId`, `noteId`) VALUES ('" + shareUserId +"', '" + noteId +"')";
      var sqlSelectShareUsers= "SELECT user.userName FROM user INNER JOIN subscribed_user_notes ON user.userId = subscribed_user_notes.userId WHERE subscribed_user_notes.noteId= '" + noteId +"'";
      db.query(sqlnotesUpdate, [title,content,categoryId,noteId] , function(err){  
         if (err) { throw err; }
         db.query(sqlnotesSelect, function(err, result){  
            if (err) { throw err; }
            db.query(sqlSelectUsers, function(err, userResult){  
               if (err) { throw err; } 
               db.query(sqlSelectShareUsers, function(err, sharedUsersResult){  
               
               if (err) { throw err; }
               if (shareUserId == 0){
                  res.render('singleNote.ejs', {notes:result[0], users:userResult, message:"", userList:sharedUsersResult});
                  console.log('we do a put request');
                  console.log({notes:result[0]});
                  console.log("Updating note with Id:" + noteId);   
                  console.log("Note Id:" + noteId + " User Id:" + shareUserId);
                  console.log("NO SHARED USER SELECTED: subcribed user database not updated! :D")
               }
               
               else{
                  db.query(sqlShareUsers, function(err){  
                     if (err) { throw err; }                  
                     res.render('singleNote.ejs', {notes:result[0], users:userResult, message: "note shared with user: " + shareUserName, userList:sharedUsersResult});
                     console.log('we do a put request');
                     console.log({notes:result[0]});
                     console.log("Updating note with Id:" + noteId);   
                     console.log("Note Id:" + noteId + " User Id:" + shareUserId);
                  });  
               }    
            });    
            });
         });
      });
   }

   if(req.method === "GET")
   {
      console.log('we start a get request');
      var noteId = req.params.noteId;
      var userId = req.session.userId;
      var sqlnotes= "SELECT categories.categoryId, categories.categoryName, notes.noteId, notes.title, notes.content, notes.date FROM categories INNER JOIN notes ON categories.categoryId = notes.categoryId_Fk WHERE  notes.noteId = '"+noteId+"' ORDER BY  notes.noteId DESC ";
      var sqlSelectUsers= "SELECT * FROM user WHERE userId != '"+userId+"';"
      var sqlSelectShareUsers= "SELECT user.userName FROM user INNER JOIN subscribed_user_notes ON user.userId = subscribed_user_notes.userId WHERE subscribed_user_notes.noteId= '" + noteId +"'";
      db.query(sqlnotes, function(err, result){  
            console.log({notes : result});
            req.session.noteId = result[0].noteId;
            console.log("note id:" + result[0].noteId);
         db.query(sqlSelectUsers, function(err, userResult){  
               if (err) { throw err; }
            db.query(sqlSelectShareUsers, function(err, sharedUsersResult){  
               if (err) { throw err; }
               res.render('singleNote.ejs', {notes:result[0], users:userResult, message: "", userList:sharedUsersResult});
               console.log('we do a put request');
               console.log({notes:result[0]});
               console.log("Updating note with Id:" + noteId);
            });
         });
      });
   }

   if(req.method === "DELETE")
   {
      var noteId = req.session.noteId;
      var userId = req.session.userId;
      var sqlnotesdelete= "DELETE FROM `notes` WHERE noteId='"+noteId+"'";
      var sql="SELECT * FROM `user` WHERE `userId`='"+userId+"'";
      var sqlnotes= "SELECT categories.categoryName, notes.noteId, notes.title, notes.content, notes.date FROM categories INNER JOIN notes ON categories.categoryId = notes.categoryId_Fk WHERE EXISTS (SELECT * FROM notes WHERE notes.userId_Fk = '"+userId+"') ORDER BY notes.noteId DESC";
      var sqlSelectSharedNotes = "SELECT DISTINCT subscribed_user_notes.noteId, notes.title, notes.content, notes.categoryId_Fk, categories.categoryName, user.userName FROM subscribed_user_notes INNER JOIN notes ON	notes.noteId = subscribed_user_notes.noteId INNER JOIN categories ON notes.categoryId_Fk = categories.categoryId INNER JOIN user ON	user.userId = notes.userId_Fk WHERE subscribed_user_notes.userId= '"+userId+"' ORDER BY notes.noteId DESC";
         db.query(sqlnotesdelete, function(err){
            if (err) { throw err; }
            db.query(sql, function(err, result){
               db.query(sqlSelectSharedNotes, function(err, sharedNotes){ 
                     db.query(sqlnotes, function(err, resultat){  
                        if (err) { throw err; }
                        console.log('we start a delete request');
                        res.render('profile.ejs',{data : result, notes: resultat, sharedNotes: sharedNotes});
                     });
               });
            });
          });
   }

   if(req.method === "POST")
   {
      var post = req.body;
      var userId = post.userId;
      var noteId = req.session.noteId;
      var sqlShareUsers= "INSERT INTO subscribed_user_notes VALUES (`userId`, `noteId`)  VALUES ('" + userId +"', '" + noteId +"')";
      db.query(sqlShareUsers, function(err){  
         if (err) { throw err; }
         console.log("Note Id:" + noteId + " User Id:" + userId);
       });
   }

};


exports.createNote = function(req, res){

   if(req.method === "GET"){
      console.log("we do a get request");
      res.render('singleNote.ejs', {notes : null});
   }

   if(req.method === "POST"){
      console.log("we do a post request")
      cDatetime = new Date().toISOString().slice(0,19).replace('T','');
      cDate = cDatetime.slice(0,10);
      cTime = cDatetime.slice(10,18);
      var post = req.body;
      var title = post.title;
      var content = post.content;
      var categoryId = post.categoryId;
      var userId = req.session.userId;
      var sqlnotescreate = "INSERT INTO notes (userId_Fk, title, content, date, time, categoryId_Fk) VALUES ('"+userId+"', '"+title+"' , '"+content+"', '"+cDate+"', '"+cTime+"', '"+categoryId+"')";
      db.query(sqlnotescreate, function(err){
         if (err) { throw err; }
         console.log("Create note succesful!");

         var userId = req.session.userId;
         var sql="SELECT * FROM `user` WHERE `userId`='"+userId+"'";
         var sqlnotes= "SELECT categories.categoryName, notes.noteId, notes.title, notes.content, notes.date FROM categories INNER JOIN notes ON categories.categoryId = notes.categoryId_Fk WHERE notes.userId_Fk = '"+userId+"' ORDER BY notes.noteId DESC";
         var sqlSelectSharedNotes = "SELECT DISTINCT subscribed_user_notes.noteId, notes.title, notes.content, notes.categoryId_Fk, categories.categoryName, user.userName FROM subscribed_user_notes INNER JOIN notes ON	notes.noteId = subscribed_user_notes.noteId INNER JOIN categories ON notes.categoryId_Fk = categories.categoryId INNER JOIN user ON	user.userId = notes.userId_Fk WHERE subscribed_user_notes.userId= '"+userId+"' ORDER BY notes.noteId DESC";
         db.query(sql, function(err, result){ 
            db.query(sqlnotes, function(err, resultat){  
               db.query(sqlSelectSharedNotes, function(err, sharedNotes){ 
                  console.log({data : result, notes: resultat});
                  res.render('profile.ejs',{data : result, notes: resultat, sharedNotes: sharedNotes});
               });
            });
         });
      }
      )};
};

exports.shareNote = function(req, res){

}