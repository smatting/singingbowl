function Bell() {
    var bellsound = new Audio("media/singingbowl.m4a");

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
        bellsound.play();

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
    this.isReset = false;

    this.reset = function(times) {
        this.times = times;
        this.running = false;
        this.lastPhase = 0;
        this.isReset = true;
    }

    function getTime() {
        return (new Date()).getTime();
    }

    this.pause = function() {
        if(this.timerHandle)
            window.clearInterval(this.timerHandle);
        this.running = false;
    }

    this.run = function() {
        window.clearInterval(this.timerHandle);
        var that = this;
        this.timerHandle = window.setInterval(function() { that.tick() }, 100);

        this.lastTick = getTime();

        if(this.isReset) {
            /* run is called first time after reset */
            this.ontransition(0);
        }
        this.running = true;
        this.isReset = false;
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
    this.id = id;
    this.minutes = minutes;

    this.save = function(val) {
        var m = parseFloat(val);
        if(!isNaN(m) && m >= 0) {
            this.minutes = m;

            var saveObj = {};
            saveObj[this.id] = this.minutes;
            chrome.storage.local.set(saveObj);
            if(this.onchange)
                this.onchange();
        }
    }

    var that = this;

    this.load = function() {
        chrome.storage.local.get(this.id, function(obs) {
            if(obs[that.id] != undefined) {
                that.minutes = obs[that.id];
                if(that.onchange)
                    that.onchange();
            }
        });
    }
}

function MinutesView(model, el) {
    this.update = function() {
        var mins = this.model.minutes;
        $(this.label).html(mins);
        $(this.input).attr("value", mins);
        if(mins > 1) {
            $(this.units).html("minutes");
        } else {
            $(this.units).html("minute");
        }
    }

    var that = this;
    this.commit = function() {
        that.model.save($(this.input).attr("value"));
    }

    this.model = model;
    this.el = el;

    this.silenceText = $("<span>Silence for</span>");
    this.input = $("<input type='text' size='3' maxlength='5'>");
    $(this.input).attr("id", $(this.el).attr("id") + "-input");
    $(this.input).hide();

    this.label = $("<label>");
    $(this.label).attr("for", $(this.input).attr("id"));


    this.units = $("<span>");

    var that = this;

    $(this.label).click(function() {
        $(that.label).hide();
        $(that.input).show();
        $(that.input).attr("value", $(that.label).html());
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

    this.model.onchange = function() {
        that.update();
    }

    $(this.el).append("Silence for ");
    $(this.el).append(this.label);
    $(this.el).append(this.input);
    $(this.el).append(" ");
    $(this.el).append(this.units);
    $(this.el).append(".");

    this.update();
}

function MeditationApp() {
    var bell = new Bell;
    var timer = new PhasedTimer;

    var preparationModel = new MinutesModel("preparation-minutes", 1);
    var preparationView = new MinutesView(preparationModel, $("#config-preparation"));
    preparationModel.load();

    var meditationModel = new MinutesModel("meditation-minutes", 30);
    var meditationView = new MinutesView(meditationModel, $("#config-meditation"));
    meditationModel.load();

    this.setMode = function(mode) {
        this.mode = mode;
        switch(this.mode) {
            case "indicator":
                $("#phases").removeClass("config-mode");
                $("#phases").addClass("indicator-mode");
                break;
            case "config":
                $("#phases").removeClass("indicator-mode");
                $("#phases").addClass("config-mode");
                break;
        };
    }
    this.setMode("config");

    this.highlight = function(k) {
        if (0 <= k && k <= 3) {
            $("#phases .phase").addClass("inactive");
            $("#phases .phase").eq(k).removeClass("inactive");
        } else {
            $("#phases .phase").removeClass("inactive");
        }
    }

    this.updateIndicators = function() {
        var preparationSecsLeft = Math.floor(timer.times[0] / 1000);
        $("#indicator-preparation").html(preparationSecsLeft.toString().toMMSS());
        var meditationSecsLeft = Math.floor(timer.times[2] / 1000);
        $("#indicator-meditation").html(meditationSecsLeft.toString().toMMSS());
    }

    var that = this;

    timer.ontick = function() {
        that.updateIndicators();
    }

    timer.ontransition = function(k) {
        that.highlight(k);
        if(k == 1 || k == 3)
            bell.ring();
    }

    timer.onend = function() {
        that.highlight(-1);
        $("#timer-button").html("Start Timer");
        that.setMode("config");
    }

    $("#timer-button").click(function() {
        if(that.mode == "config") {
            /* button is clicked to start timer */
            timer.reset([Math.floor(preparationModel.minutes*60*1000),2*1000,Math.floor(meditationModel.minutes*60*1000),2*1000]);
            that.updateIndicators();
            that.setMode("indicator");
            $("#timer-button").html("Pause Timer");
            timer.run();
        } else {
            if(timer.running) {
                /* button is clicked to pause timer */
                $("#timer-button").html("Resume Timer");
                timer.pause();
            } else {
                /* button is clicked to resume timer */
                $("#timer-button").html("Pause Timer");
                timer.run();
            }
        }
    });

    $("#bowl").click(function() {
        bell.ring();
    });

    $("#stop-sound").click(function() {
        bell.mute();
        return false;
    });

    bell.onring = function() {
        $("#stop-sound").css("visibility", "visible");
    }

    bell.onend = function() {
        console.log("bell end");
        $("#stop-sound").css("visibility", "hidden");
    }
}

$(document).ready(function () {
    var app = new MeditationApp();
});
