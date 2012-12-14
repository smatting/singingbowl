function Bell() {
    var bellsound = new Audio("singingbowl.wav");

    var ringing = false;

    this.mute = function() {
        if(this.ringing) {
            bellsound.pause();
            this.ringing = false;
            if(this.onend)
                this.onend();
        }
    }

    this.ring = function() {
        this.ringing = true;
        bellsound.currentTime = 0;
        console.log("ring!");
        //bellsound.play();

        if(this.onring)
            this.onring();

        if(this.timeout) 
            window.clearTimeout(this.timeout);
        var that = this;
        this.timeout = window.setTimeout(function() {that.mute()}, 14*1000);
    }
}


String.prototype.toMMSS = function () {
    var sec_numb    = parseInt(this);
    var minutes = Math.floor(sec_numb / 60);
    var seconds = sec_numb - (minutes * 60);

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = minutes+':'+seconds;
    return time;
}

function PhasedTimer(times) {
    this.times = times;
    this.running = false;
    this.lastPhase = 0;

    function getTime() {
        return (new Date()).getTime();
    }

    this.pause = function() {
        window.clearInterval(this.timerHandle);
        this.running = false;
    }

    this.run = function() {
        window.clearInterval(this.timerHandle);
        var that = this;
        this.timerHandle = window.setInterval(function() { that.tick() }, 100);

        this.lastTick = getTime();
        this.running = true;
        this.ontransition(0);
    }

    this.tick = function() {
        var now = getTime();
        var delta = now - this.lastTick;

        var k = this.lastPhase;
        while(k < this.times.length && delta > 0) {

            var ttk_before = this.times[k];
            this.times[k] = Math.max(0, this.times[k] - delta);
            delta = delta - (ttk_before - this.times[k]);

            if(this.times[k] == 0) {
                k += 1;
                if(this.ontransition)
                    this.ontransition(k);
            }
        }

        if(this.ontick)
            this.ontick();

        if(k >= this.times.length) {
            this.pause();
            this.lastPhase = 0;
            if(this.onend)
                this.onend();
            return;
        }

        this.lastPhase = k;
        this.lastTick = now;
    }
}

function MinutesModel(id, minutes) {
    if(minutes) {
        this.minutes = minutes;
    }

    this.save = function(val) {
        this.minutes = parseInt(val);
        if(this.onChange)
            this.onChange();
    }
}

function MinutesView(model, el) {

    this.update = function() {
        var mins = this.model.minutes;
        $(this.label).html(mins);
        $(this.input).attr("value", mins);
        if(mins > 1) {
            $(this.units).html("minutes.");
        } else {
            $(this.units).html("minute.");
        }
    }

    this.commit = function() {
        this.model.save($(this.input).attr("value"));
    }

    this.model = model;
    this.el = el;

    this.silenceText = $("<span>Silence for</span>");
    this.input = $("<input type='text' size='3' maxlength='3'>");
    $(this.input).attr("id", $(this.el).attr("id") + "-input");
    $(this.input).hide();

    this.label = $("<label>");
    $(this.label).attr("for", $(this.input).attr("id"));


    this.units = $("<span>");

    var that = this;
    $(this.label).click(function() {
            $(that.label).hide();
            $(that.input).show();
            $(that.input).focus();
            return true;
            });

    $(this.input).blur(function() {
            that.commit();
            $(that.label).show();
            $(that.input).hide();
            });

    $(this.input).focus(function() {
            $(this).select();
            });

    $(this.input).keypress(function(e) {
            if (e.keyCode == 13)
            $(this).blur();
            });


    this.model.onChange = function() {
        that.update();
    }

    $(this.el).append(this.silenceText);
    $(this.el).append(this.label);
    $(this.el).append(this.input);
    $(this.el).append(this.units);
}




function AppView() {
    var bell = new Bell;
    var timer = new PhasedTimer([1000,1000,1000,1000]);

    var preparationModel = new MinutesModel("preparation-minutes", 1);
    var preparationView = new MinutesView(preparationModel, $("#config-preparation"));
    preparationView.update();

    var meditationModel = new MinutesModel("meditation-minutes", 30);
    var meditationView = new MinutesView(meditationModel, $("#config-meditation"));
    meditationView.update();


    function resetTimer() {
        timer.reset([2*1000,2*1000,2*1000,2*1000]);
    }

    function highlight(k) {
        if (0 <= k && k <= 3) {
            $("#phases li").addClass("inactive");
            $("#phases li").eq(k).removeClass("inactive");
        } else {
            $("#phases li").removeClass("incactive");
        }
    }

    var fresh = true;

    timer.ontick = updateProgress;

    timer.ontransition = function(k) {
        highlight(k);
        if(k == 1 || k == 3)
            bell.ring();
    }

    timer.onend = function() {
        $("#right-column").removeClass("running");
        $("#timer-button").html("Start Timer");
        timer.times = [1000,1000,1000,1000];
        highlight(-1);
        fresh = true;
    }

    $("#timer-button").click(function() {
            if(timer.running) {
            timer.pause();
            $("#timer-button").html("Resume Timer");
            } else {
            fresh = false;
            timer.ontick();
            timer.run();
            $("#right-column").addClass("running");
            $("#timer-button").html("Pause Timer");
            }
            });
}



function updateProgress() {
    $("#indicator-preparation").html((Math.floor(this.times[0] / 1000)).toString().toMMSS());
    $("#indicator-meditation").html((Math.floor(this.times[2] / 1000)).toString().toMMSS());
}

$(document).ready(function () {
        var app = new AppView();

        //    
        //
        //
        //
        //    $("#bowl-hint").click(function() {
        //        $("#bowl-hint").css("visibility", "hidden");
        //        bell.mute();
        //    });
        //    
        //    bell.onring = function() {
        //        $("#stop-sound").css("visibility", "visible");
        //    }
        //
        //    bell.onend = function() {
        //        $("#stop-sound").css("visibility", "hidden");
        //    }
        //
        //    $("#stop-sound").click(function() {
        //        bell.mute();
        //    });
        //
        //    $("#bowl").click(function() {
        //        bell.ring();
        //    });
        //
        //    $("#bowl-wrap").hover(function() {
        //        $("#bowl-hint").css("visibility", "visible");
        //    },
        //    function() {
        //        $("#bowl-hint").css("visibility", "hidden");
        //    });
        //
        //
        //
        //
        //    var timer = new PhasedTimer([1000,1000,1000,1000]);
        //
        //    resetTimer(timer);
});
