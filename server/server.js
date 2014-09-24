var csv = Meteor.require('csv'); 
var fs = Meteor.require('fs');
var path = Npm.require('path');

function loadHtn(hackathon_id) {
  var basepath = path.resolve('.').split('.meteor')[0];
  //console.log(basepath);
  //console.log(csv);
  var record_count = 0;
  var stream = fs.createReadStream(basepath+'htn.csv');
  //console.log(stream);
    stream.pipe(
    csv.parse     ()).pipe(
    csv.transform (Meteor.bindEnvironment(function(record){
        
        var username = "htn_user" + record_count;
        var email = "notset"+record_count+"@hackermat.ch";
        record_count++;
        var name = record[1],
            contact = record[2],
            dev_skills = record[3],
            design_skills = record[4],
            other_skills = record[5],
            linkedin = record[6],
            github = record[7],
            personal_site = record[8],
            cool_stuff = record[9],
            university = record[10],
            looking_for = record[11];
        //console.log("user: " + user);
        //console.log("email: " + email);
        //console.log("idea: " + idea);
        var profile = {
            name: name,
            login: username,
//            hackathon_id: hackathon_id,
            contact: contact,
            dev_skills: dev_skills,
            design_skills: design_skills,
            other_skills: other_skills,
            urls: {
                linkedin: linkedin,
                github: github,
                personal_site: personal_site
            },
            cool_stuff: cool_stuff,
            university: university,
            looking_for: looking_for
        };
        var password = "bogus_password";
        var options = {
            username: username,
            email: email,
            password: password,
            profile: profile
        }
        console.log(profile);
        console.log("htn user: " + record_count);
        console.log(username);
        
        var user = Accounts.createUser(options);
        console.log(user);
        /*, function(err, res) {
            console.log('user created');
            console.log(res);
            //Roles.addUsersToRoles(user._id, ['hacker'], 'ychacks');
        });    
        */
        //console.log(idea);
//        return record.map(function(value){return value.toUpperCase()});
    })));
}




function loadData(hackathon_id) {
  var basepath = path.resolve('.').split('.meteor')[0];
  //console.log(basepath);
  //console.log(csv);
  var stream = fs.createReadStream(basepath+'mhacks.csv');
  //console.log(stream);
    stream.pipe(
    csv.parse     ()).pipe(
    csv.transform (Meteor.bindEnvironment(function(record){
/*
        var idea = {
            name: name,
            description: description,
            userId: Meteor.userId(),
            hackathon_id: hackathon._id,
//            avatar_url: Meteor.user().profile.avatar_url,
//            github_username: Meteor.user().profile.login,
            user_profile: Meteor.user().profile,
            skills: {
                webdev: webdev,
                backend: backend,
                mobile: mobile,
                design: design,
                hardware: hardware
            },
            comments: {}
        };
        Meteor.call('create_idea', idea, function(err, res) {});
    }
    */
        var user = record[0],
            email = record[1],
            idea = record[3];
        //console.log("user: " + user);
        //console.log("email: " + email);
        //console.log("idea: " + idea);
        var idea = {
            description: idea,
            hackathon_id: hackathon_id,
            user_profile: {
                name: user,
                email: email,
                contact: email
            },
            skills: {
                webdev: false,
                backend: false,
                mobile: false,
                design: false,
                hardware: false 
            },
            comments: {}
        }
        //console.log(idea);
        Meteor.call('create_idea', idea, function(err, res) {});
//        return record.map(function(value){return value.toUpperCase()});
    })));
}


Meteor.startup(function () {
// code to run on server at startup
//    Ideas.remove({});
    var User = Meteor.users.findOne({"services.github.username":"kainolophobia"});
//    var User = Meteor.users.findOne({"services.github.username":"jumploops"});
    //console.log(User);
    if(User) {
//        Meteor.users.remove({_id: User._id});
    } 
    var hackathons = Hackathons.remove({"title":"blah"});
//    var hackathons = Hackathons.remove({});
//    Meteor.users.remove({}); 
//    var ideas = Ideas.remove({});
    //console.log(hackathons);

    if (Hackathons.find().count() === 0) {
        var names = ["MHacks",
                     "YC Hacks",
                     "HackMIT"
//                     "Hack the North"
                    ];
        for (var i = 0; i < names.length; i++) {
            Meteor.call('create_hackathon', names[i]);
        }
        var hackathon = Hackathons.findOne({url_title: 'mhacks'});
        if(hackathon) {
            loadData(hackathon._id);
        }
        var hackathon = Hackathons.findOne({url_title: 'hackthenorth'});
        if(hackathon) {
            loadHtn(hackathon._id);
        }
    }
    console.log("blah");
    /*
    var htn_users = Meteor.users.find({username: /htn_user./i}).fetch();
    _.each(htn_users, function(user) {
        Roles.addUsersToRoles(user._id, ['hacker'], 'hackthenorth');
    });
    */
});

Meteor.publish("user_notifications", function(userId){
    return Notifications.find({'userId': userId});
});

Meteor.publish("user", function (username) {
    return Meteor.users.find({'services.github.username': username}); 
});
    
Meteor.publish("user_and_ideas", function (username){
    console.log(username);
    return [
        Meteor.users.find({'services.github.username': username}),
        Ideas.find({'github_username': username})
    ];
})
     
Meteor.publish("one_users_ideas", function (username){
    console.log(username);
    return Ideas.find({'github_username': username});
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

Meteor.publish("users_and_hackathon", function (hackathon_title) {
    var user = Meteor.users.findOne({_id: this.userId});
    if(!hackathon_title) return;
    var url_title = encodeURI(hackathon_title.toLowerCase().replace(/ /g, ''));
    var hackathon = Hackathons.findOne({url_title: url_title});
    var hackathon_id = null;
    if(hackathon) {
        hackathon_id = hackathon._id; 
    }

    if (Roles.userIsInRole(this.userId, ['hacker', 'organizer', 'admin'], url_title)) {
        var query = {
            roles: {}
        };
        query["roles"][url_title] = ['hacker'];
        return Meteor.users.find(query);
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
    //console.log(user);
    if(!user) return;
    var hackathonList = [];
    _.each(user.roles, function(role, hackathon) {
        var entry = {};
        if(role == "admin") {
            //console.log("admin role found");
        }
        //console.log(role);
        //console.log(hackathon);
        entry['url_title'] = hackathon;
        hackathonList.push(entry);
    });
    //console.dir(hackathonList);
    if(hackathonList.length) {
        return Hackathons.find({$or: hackathonList});
    } else {
        return
    }
    //return Hackathons.find({$or: hackathonList}).fetch();
});




