function Bell() {
    var bellsound = new Audio("singingbowl.wav");

    this.ringing = false;

    this.mute = function(that) {
        if(this.ringing) {
            bellsound.pause();
            this.ringing = false;
            if(this.onRingEnd)
                this.onRingEnd();
        }
    }

    this.ring = function() {
        this.ringing = true;
        bellsound.currentTime = 0;
        bellsound.play();

        if(this.onRing)
            this.onRing();

        var that = this;
        if(this.timeout) {
            window.clearTimeout(this.timeout);
            delete this.timeout;
        }
        this.timeout = window.setTimeout(function() {that.mute(that)}, 14*1000);
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

function PhasedTimer() {
    this.phaseTimes = [];

    this.onTick = function() {};
    this.onTransition = function() {};
    this.onEnd = function() {};

    this.paused = false;

    this.currentTime = function() {
        return (new Date()).getTime();
    }

    this.reset = function(pt) {
        window.clearInterval(this.timerHandle);
        this.running = false;
        this.paused = false;
        this.phaseTimes = pt;
        this.lastPhaseIndex = 0;
    }

    this.pause = function() {
        this.paused = true;
        window.clearInterval(this.timerHandle);
        this.running = false;
    }

    this.run = function() {
        window.clearInterval(this.timerHandle);
        this.lastTick = this.currentTime();
        var that = this;
        this.timerHandle = window.setInterval(function() { that.tick() }, 100);
        this.paused = false;
        this.running = true;
        this.onTransition(this);
        this.tick();
    }

    function phaseIndexFor(pt) {
        for(i=0;i<pt.length;++i) {
            if (pt[i] != 0)
                break;
        }
        return i;
    }

    this.tick = function() {
        var now = this.currentTime();
        var delta = now - this.lastTick;

       // phaseIndexFor(this.phaseTimes);
        while(this.lastPhaseIndex < this.phaseTimes.length && delta > 0) {
            this.phaseTimes[this.lastPhaseIndex] -= delta;
            if(this.phaseTimes[this.lastPhaseIndex] < 0) {
                delta = - this.phaseTimes[this.lastPhaseIndex];
                this.phaseTimes[this.lastPhaseIndex] = 0;
            } else {
                delta = 0;
            }
            var k = phaseIndexFor(this.phaseTimes);
            if(k != this.lastPhaseIndex) {
                this.onTransition(this.phaseTimes, phaseIndexFor(this.phaseTimes));
            }
            this.lastPhaseIndex = k;
        }


        this.onTick(this.phaseTimes, this.lastPhaseIndex);

        if(this.lastPhaseIndex >= this.phaseTimes.length) {
            this.pause();
            this.onEnd();
        }
        this.lastTick = now;
    }
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
    var phases = [$("#phase-0"), $("#phase-1"),  $("#phase-2"),  $("#phase-3")];
    if (k < 4) {
        for(var i=0;i < phases.length; ++i)
            phases[i].addClass("inactive");
        phases[k].removeClass("inactive");
    } else {
        for(var i=0;i < phases.length; ++i)
            phases[i].removeClass("inactive");
    }
}
function updateProgress(pt, pi) {
    highlightPhase(pi);

    $("#time-left-1").html((Math.floor(pt[0] / 1000)).toString().toMMSS());
    $("#time-left-2").html((Math.floor(pt[2] / 1000)).toString().toMMSS());
}

function resetTimer(timer) {
    var minutesPreperation = parseInt($("#label-1").html());
    var minutesMeditation = parseInt($("#label-2").html());
    //timer.reset([minutesPreperation*60*1000,2*1000,minutesMeditation*60*1000,2*1000]);
    timer.reset([500,500,500,500]);
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
    
    bell.onRing = function() {
        $("#stop-sound").css("visibility", "visible");
    }

    bell.onRingEnd = function() {
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


    var timer = new PhasedTimer;

    timer.onTick = updateProgress;

    timer.onTransition = function(pt, pi) {
        if(pi == 1 || pi == 3) {
            bell.ring();
        }
    }

    timer.onEnd = function() {
        $("#right-column").removeClass("running");
        $("#timer-button").html("Start Timer");
        resetTimer(timer);
        highlightPhase(4);
    }

    $("#timer-button").click(function() {
        if(timer.running) {
            timer.pause();
            $("#timer-button").html("Resume Timer");
        } else {
            if(timer.paused) {
            } else {
                resetTimer(timer);
            }
            $("#timer-button").html("Pause Timer");
            $("#right-column").addClass("running");
            timer.run();
        }
    });

    resetTimer(timer);

});
