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

var bell = new Bell();

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
        //this.ontransition(0);
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

function AAA() {

}

function closeEdit(spanElt) {
    var x = parseInt(spanElt.children("input").attr("value"));
    if (!isNaN(x))
        spanElt.children("label").html(x);
    var nMinutes = parseInt(spanElt.children("label").html());
    spanElt.children(".units").html(nMinutes <= 1 ? "minute." : "minutes.");
    spanElt.removeClass("editing");
}

function highlightPhase(k) {
    if (k < 4) {
        $("h1").addClass("inactive");
        $("h1").eq(k).removeClass("inactive");
    } else {
        $("h1").removeClass("inactive");
    }
}
function updateProgress() {
    $("#time-left-1").html((Math.floor(this.times[0] / 1000)).toString().toMMSS());
    $("#time-left-2").html((Math.floor(this.times[2] / 1000)).toString().toMMSS());
}

function resetTimer(timer) {
    var minutesPreperation = parseInt($("#label-1").html());
    var minutesMeditation = parseInt($("#label-2").html());
    //timer.reset([minutesPreperation*60*1000,2*1000,minutesMeditation*60*1000,2*1000]);
    //timer.reset([2*1000,2*1000,2*1000,2*1000]);
    //timer.reset([500,500,500,500]);
}


$(document).ready(function () {
    $("#edit-1").click(function() {
        $("#edit-1").attr("value", $("#label-1").html());
        $("#span-1").addClass("editing");
        $("#edit-1").select();
    });
    $("#edit-1").blur(function() {
        closeEdit($("#span-1"));
    });
    $("#edit-1").keypress(function(e) {
        if (e.keyCode == 13)
            closeEdit($("#span-1"));
    });
    $("#label-1").focus(function(e) {
        console.log("got focus!");
    });

    $("#edit-2").click(function() {
        $("#edit-2").attr("value", $("#label-2").html());
        $("#span-2").addClass("editing");
        $("#edit-2").select();
    });
    $("#edit-2").blur(function() {
        closeEdit($("#span-2"));
    });
    $("#edit-2").keypress(function(e) {
        if (e.keyCode == 13)
            closeEdit($("#span-2"));
    });
    



    $("#bowl-hint").click(function() {
        $("#bowl-hint").css("visibility", "hidden");
        bell.mute();
    });
    
    bell.onring = function() {
        $("#stop-sound").css("visibility", "visible");
    }

    bell.onend = function() {
        $("#stop-sound").css("visibility", "hidden");
    }

    $("#stop-sound").click(function() {
        bell.mute();
    });

    $("#bowl").click(function() {
        bell.ring();
    });

    $("#bowl-wrap").hover(function() {
        $("#bowl-hint").css("visibility", "visible");
    },
    function() {
        $("#bowl-hint").css("visibility", "hidden");
    });





    closeEdit($("#span-1"));
    closeEdit($("#span-2"));


    var timer = new PhasedTimer([1000,1000,1000,1000]);
    var fresh = true;

    timer.ontick = updateProgress;

    timer.ontransition = function(k) {
        highlightPhase(k);
        if(k == 1 || k == 3)
            bell.ring();
    }

    timer.onend = function() {
        $("#right-column").removeClass("running");
        $("#timer-button").html("Start Timer");
        timer.times = [1000,1000,1000,1000];
        highlightPhase(4);
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

    resetTimer(timer);

});
