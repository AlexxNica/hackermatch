var csv = Meteor.require('csv'); 
var fs = Meteor.require('fs');
var path = Npm.require('path');

function loadData() {
  var basepath = path.resolve('.').split('.meteor')[0];
  console.log(basepath);
  console.log(csv);
  var stream = fs.createReadStream(basepath+'mhacks.csv');
  console.log(stream);
    stream.pipe(
    csv.parse     ()).pipe(
    csv.transform (function(record){
        return record.map(function(value){return value.toUpperCase()});
    })).pipe(
    csv.stringify ()).pipe(process.stdout);
        /*
  csv().from.stream(
    fs.createReadStream(basepath+'server/data/enron_data.csv'),
      {'escape': '\\'})
    .on('record', Meteor.bindEnvironment(function(row, index) {
        console.log(row);
      Emails.insert({
        'sender_id': row[0]
        // etc.
        })
      }, function(error) {
          console.log('Error in bindEnvironment:', error);
      }
    ))
    .on('error', function(err) {
      console.log('Error reading CSV:', err);
    })
    .on('end', function(count) {
      console.log(count, 'records read');
    });
        */

}


Meteor.startup(function () {
// code to run on server at startup
//    Ideas.remove({});
    var User = Meteor.users.findOne({"services.github.username":"kainolophobia"});
    var User = Meteor.users.findOne({"services.github.username":"jumploops"});
    console.log(User);
//    Meteor.users.remove({_id: "3QsrE6TsjakgjBuvP"});
    if(User) {
//        Meteor.users.remove({_id: User._id});
    } 
    var hackathons = Hackathons.remove({"title":"blah"});
//    var hackathons = Hackathons.remove({});
    console.log(hackathons);

    if (Hackathons.find().count() === 0) {
      var names = ["MHacks",
                   "YC Hacks",
                   "HackMIT"
                   ];
      for (var i = 0; i < names.length; i++) {
        Meteor.call('create_hackathon', names[i]);
      }
    }
    loadData();
});

Meteor.publish("user", function (username) {

    return Meteor.users.find({'services.github.username': username}); 
});

//Very inefficient function that finds hackathon by title, then uses 
// the id of the returned hackathon to "publish" the cursor of that 
// same hackathon. Should probably get cursor first, then return it 
// after fetching id.
Meteor.publish("hackathon_and_ideas", function (hackathon_title) {
    
    var url_title = encodeURI(hackathon_title.toLowerCase().replace(/ /g, ''));
    var hackathon = Hackathons.findOne({url_title: url_title});
    
    var hackathon_id = null;
    if(hackathon) {
        hackathon_id = hackathon._id; 
    }

    if (Roles.userIsInRole(this.userId, ['hacker', 'organizer', 'admin'], url_title)) {
        return [
    // Need to remove users and comments from access like this
            Comments.find({}),
    // end TODO
            Hackathons.find({_id: hackathon_id}),
            Ideas.find({hackathon_id: hackathon_id}),
            Hearts.find({ $and: [{hackathon_id: hackathon_id}, {user_id: this.userId}]})
        ];
    } else {
        // user not authorized. do not publish secrets
        this.stop();
        return;
    }
});


// server: publish the set of parties the logged-in user can see.
Meteor.publish("hackathons", function () {
    if (Roles.userIsInRole(this.userId, ['admin'], 'all')) {

        return Hackathons.find({});

    } else {
        // user not authorized. do not publish secrets
        this.stop();
        return;
    }
});

// server: publish the set of parties the logged-in user can see.
Meteor.publish("myHackathons", function () {
    var user = Meteor.users.findOne({_id: this.userId});
    console.log(user);
    if(!user) return;
    var hackathonList = [];
    _.each(user.roles, function(role, hackathon) {
        var entry = {};
        if(role == "admin") {
            console.log("admin role found");
        }
        console.log(role);
        console.log(hackathon);
        entry['url_title'] = hackathon;
        hackathonList.push(entry);
    });
    console.dir(hackathonList);
    if(hackathonList.length) {
        return Hackathons.find({$or: hackathonList});
    } else {
        return
    }
    //return Hackathons.find({$or: hackathonList}).fetch();
});




