Template.sidebar.events({
    'click #sidebar-exit' : function(e, t){
        $('.page-container').trigger('click');
    },
    'submit #comment-create' : function(e, t) {
        e.preventDefault();
        var text = t.find('#comment-text').value;
        if(text != ""){
            t.find('#comment-text').value = "";
            var comment = {
                userId: Meteor.userId(),
                username: Meteor.user().profile.name,
                login: Meteor.user().profile.login,
                avatar_url: Meteor.user().profile.avatar_url,
                text: text,
                skills: Meteor.user().profile.skills,
                time: new Date().getTime(),
                ideaId: Session.get("selectedIdea")
            };

            Comments.insert(comment, function(err, result) {
                if(err) {
                    console.log("error creating comment");
                } else {
                    //hackety hackety hack
                    //console.log("comment added!");
                }
            });
            // todo subscribers are not unique duplicated
            var subscribers = Comments.find({$and: [{ideaId: Session.get("selectedIdea")}, {userId: Meteor.userId()}] }).fetch(); // todo this code is likely wrong
            var idea = Ideas.findOne({_id: Session.get("selectedIdea")});
            for(var i = 0; i < subscribers.length; i++){
                var heartedNotification = {};
                heartedNotification[idea.userId] = {
                    type: "comment",
                    message: "New comment on "+idea.name,
                    url: null,
                    priority: 2,
                    timestamp: (new Date()).getTime(),
                    hackathon: idea.hackathon_id
                };
                var notifId = Notifications.find({userId: idea.userId}).fetch()._id;
                console.log(Notifications.find({userId: idea.userId}).fetch());

                Notifications.update({_id: notifId}, {notifications: {$push: heartedNotification}}, function(err, result) {
                    if(err){
                        console.error('failed to create notification model for user')
                    }
                    else {
                        console.log('new notification for user'+idea.userId);
                    }
                }); 
            }
        }
    },
    'keyup #comment-create' : function(e){
        if(e.keyCode == 13){
            $('#comment-create').submit();
        }
    }
});

Template.personRow.events({
    'click .person-row': function(e){
        Router.go('/user/'+$(e.currentTarget).closest('.person-row').data('id'));
    }
});

Template.hackathon.events({
    'click .sidebar' : function(e, t) {
        e.stopPropagation();
    },
    'click .profile_sidebar' : function(e, t){
        e.stopPropagation();
    },
    'click .page-container' : function(e, t) {
        var id = e;
        if(Session.get("sidebarOpened") == "open" || Session.get('profile_sidebarOpened') == "open") {
            e.preventDefault();
            Session.set('selectedIdea', '');
            Session.set('sidebarOpened', '');
            Session.set('selectedProfile', '');
            Session.set('profile_sidebarOpened', '');
            $('.pt-triggers, #pt-main, #title-bar').removeClass('blur');
        } 
    }
});

Template.home.events({
    'click #incomplete-profile': function (e, t){
        Router.go('settings');
    }
});

Template.home.events({
    'submit #join_hackathon' : function(e, t) {
        e.preventDefault();

        var invite_code = t.find("#join_hackathon_code").value;

        t.$("#join_hackathon_code").val("");

        Meteor.call('join_hackathon', invite_code, function(err, res) {       
            if(res) {
                Router.go('hackathon', {_title: res});
            }    
        });
    }
});

Template.showHackathons.events({
    'click #no-idea-posted': function(){
        Router.go('/idea');
    },
    'click #team-reminder': function(){
        // Router.go('/people');
    }
});

Template.admin.events({
    'submit #create_hackathon' : function(e, t) {
        e.preventDefault();

        var title = t.find("#new_hackathon_name").value;
        if(title.indexOf('/') != -1){
            alert('Hackathon names can\'t contain / because we use them for routes');
            return;         
        }
        t.$("#new_hackathon_name").val("");

        Meteor.call('create_hackathon', title, function(err, res) {});
    }
});

Template.create_hackathon.events({
    'submit #add-hackathon-form': function(){
        
    }
});

Template.idea_create_template.events({
    'keyup #idea-create' : function(e){
        if(e.keyCode == 13){
            if($('.fs-number-current').text() == "3") {
                e.preventDefault();
                $('.fs-continue').click();
            }
        }
    },
    'click .fs-continue' : function(e, t) {
        if($('.fs-number-current').text() != "3") {
            return;
        }
        e.preventDefault();
        var description = t.find('#q1').value
        , name = t.find('#q2').value
        , webdev = t.find('#cb1').checked
        , design = t.find('#cb2').checked
        , backend = t.find('#cb3').checked
        , mobile = t.find('#cb4').checked
        , hardware = t.find('#cb5').checked;


        //hackety hackety hack
        $('#my-group').trigger('click');
        $('#idea-create').removeClass('fs-form-overview')
        $('#idea-create').addClass('fs-form-full');
        $("#my-group").trigger("click");
        $('.fs-fields li').removeClass('fs-current');
        $($('.fs-fields li')[0]).addClass('fs-current');
        $('.fs-fields input').val('');
        $('.fs-fields textarea').val('');
      
        $('.fs-controls > *').addClass('fs-show');
        $('.fs-controls').height($('.pt-page-3').height());
        //using pageTransitions library, instead of Meteor routing...
        
        var hackathon = Session.get("current_hackathon");
       
        //TODO make a better error case, shouldn't even get this far...
        if(!hackathon || hackathon == "") {
            console.log("no hackathon selected");
            Router.go('home');
            return;
        }
        
        Router.go('hackathon', {_title: hackathon.title});

        if(!description) return;

        var idea = {
            name: name,
            description: description,
            userId: Meteor.userId(),
            hackathon_id: hackathon._id,
            //            avatar_url: Meteor.user().profile.avatar_url,
            //            github_username: Meteor.user().profile.login,
            time: new Date().getTime(),
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
});

Template.settings.events({
    'click .delete-language': function(e, t){
        $(e.currentTarget).closest('.specialization').remove();
        var langs = $('.language').toArray().map(function(el){
            return $(el).val();
        });
        var updated_profile = {
            languages: langs
        };
        updated_profile = _.extend(Meteor.user().profile, updated_profile);
        Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile":updated_profile}});
    },
    'click .add-language': function(){
        var langs = $('.language').toArray().map(function(el){
            return $(el).val();
        });
        langs.push('');
        var updated_profile = {
            languages: langs
        };
        updated_profile = _.extend(Meteor.user().profile, updated_profile);
        Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile":updated_profile}});
    },
    'submit #update-user-form' : function(e, t){
        e.preventDefault();
        var q1 = t.find('#user_name').value
        , q2 = t.find('#user_contact').value
        , q3 = t.find('#user_skills').value
        , q5 = t.find('#user_description').value
        , webdev = t.find('#sb1').checked
        , design = t.find('#sb2').checked
        , backend = t.find('#sb3').checked
        , mobile = t.find('#sb4').checked
        , hardware = t.find('#sb5').checked;
        var langs = $('.language').toArray().map(function(el){
            return $(el).val();
        });
        console.log(langs);
        var updated_profile = {
            name: q1,
            contact: q2,
            skills: {
                backend: backend,
                design: design,
                hardware: hardware,
                mobile: mobile,
                webdev: webdev
            },
            bio: q5, 
            languages: langs
        };
        updated_profile = _.extend(Meteor.user().profile, updated_profile);
        
        // Trim and validate the input
        Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile":updated_profile}});
        Meteor.call('attach_ideas', Meteor.user()._id);
        Meteor.call('update_ideas', Meteor.user()._id);
       
        return false;
    },
    'click #logout': function (e, t) {
        e.preventDefault();
        if (Meteor.user()) {
            Meteor.logout(function() {
                Router.go('index');
            });
        }
    }
});

Template.nav.events({
    'click #join-link' : function(){
        var profile = {}

        Meteor.loginWithGithub({
            requestPermissions: ['user:email']
        }, function (err) {
            if (err) {
                Session.set('errorMessage', err.reason || 'Unknown error');
            }
            if(Meteor.user()) {
                profile = _.extend(profile, Meteor.user().profile);
                //Temporarily set contact info as email
                profile.contact = profile.email;
                Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile":profile}});

                var invite_title = Session.get("invite_title");
                var invite_code = Session.get("invite_code");
                if(invite_title && invite_code) {
                    Meteor.call('join_hackathon', invite_code, function(err, res) {
                        if(res) {
                            Router.go('hackathon', {_title: res});
                        }    
                    });
                } 
                else {
                    Router.go('home');
                }
            }
        });
    }
});

Template.indexHackathon.events({
    'submit #register-form' : function(e, t) {
        e.preventDefault();
    
        var webdev = t.find('#cb1').checked,
            backend = t.find('#cb3').checked,
            mobile = t.find('#cb4').checked,
            design = t.find('#cb2').checked,
            hardware = t.find('#cb5').checked;

        // Trim and validate the input
        var profile = {
            //                name: name,
            //                contact: email,
            //                github: github,
            skills: {
                webdev: webdev,
                backend: backend,
                mobile: mobile,
                design: design,
                hardware: hardware
            }
        }

        Meteor.loginWithGithub({
            requestPermissions: ['user:email']
        }, function (err) {
            if (err) {
              Session.set('errorMessage', err.reason || 'Unknown error');
            }
            if(Meteor.user()) {
                profile = _.extend(profile, Meteor.user().profile);
                //Temporarily set contact info as email
                profile.contact = profile.email;
                Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile":profile}});
              
                var invite_title = Session.get("invite_title");
                var invite_code = Session.get("invite_code");
                if(invite_title && invite_code) {
                    Meteor.call('join_hackathon', invite_code, function(err, res) {
                        if(res) {
                            Router.go('hackathon', {_title: res});
                        }    
                    });
                } else {
                    Router.go('home');
                }
            }
        });


        /*
        Accounts.createUser(options, function(err){
          if (err) {
            console.error('no user created :(');
            alert('This email is already registered');
            // Inform the user that account creation failed
          } else {
            Router.go('home');
            // Success. Account has been created and the user
            // has logged in successfully. 
          }

        });
        */

        return false;
    }
});

// Template.login.events({
//     'submit #login-form' : function(e, t){
//         e.preventDefault();
//         // retrieve the input field values
//         var email = t.find('#login-email').value
//         , password = t.find('#login-password').value;

//         // Trim and validate your fields here.... 

//         // If validation passes, supply the appropriate fields to the
//         // Meteor.loginWithPassword() function.
//         Meteor.loginWithPassword(email, password, function(err){
//             if (err) {
//                 console.log(err);
//                 // The user might not have been found, or their passwword
//                 // could be incorrect. Inform the user that their
//                 // login attempt has failed. 
//             } 
//             else {
//                 Router.go('home');
//                 // The user has been logged in.
//             }
//         });
//         return false; 
//     }
// });

Template.idea_filter.events({ 
  'mousedown .filter': function () {
    if (Session.equals('idea_filter', this.filter)) {
        //Session.set('idea_filter', null);
    } else {
        Session.set('idea_filter', this.filter);
    }
  }
});