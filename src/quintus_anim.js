Quintus.Anim = function(Q) {
  Q._animations = {};
  Q.animations = function(sprite,animations) {
    if(!Q._animations[sprite]) Q._animations[sprite] = {};
    _.extend(Q._animations[sprite],animations);
  };

  Q.animation = function(sprite,name) {
    return Q._animations[sprite] && Q._animations[sprite][name];
  };

  Q.component('animation',{
    added: function() {
      var p = this.entity.p;
      p.animation = null;
      p.animationPriority = -1;
      p.animationFrame = 0;
      p.animationTime = 0;
      this.entity.on("step",this,"step");
    },
    extend: {
      play: function(name,priority) {
        this.animation.play(name,priority);
      }
    },
    step: function(dt) {
      var entity = this.entity,
          p = entity.p;
      if(p.animation) {
        var anim = Q.animation(p.sprite,p.animation),
            rate = anim.rate || p.rate,
            stepped = 0;
        p.animationTime += dt;
        if(p.animationChanged) {
          p.animationChanged = false;
        } else { 
          p.animationTime += dt;
          if(p.animationTime > rate) {
            stepped = Math.floor(p.animationTime / rate);
            p.animationTime -= stepped * rate;
            p.animationFrame += stepped;
          }
        }
        if(stepped > 0) {
          if(p.animationFrame >= anim.frames.length) {
            if(anim.loop === false || anim.next) {
              p.animationFrame = anim.frames.length - 1;
              entity.trigger('animEnd');
              entity.trigger('animEnd.' + p.animation);
              p.animation = null;
              p.animationPriority = -1;
              if(anim.trigger) {  
                entity.trigger(anim.trigger,anim.triggerData) 
              }
              if(anim.next) { this.play(anim.next,anim.nextPriority); }
              return;
            } else {
              entity.trigger('animLoop');
              entity.trigger('animLoop.' + p.animation);
              p.animationFrame = p.animationFrame % anim.frames.length;
            }
          }
          entity.trigger("animFrame");
        }
        p.sheet = anim.sheet || p.sheet;
        p.frame = anim.frames[p.animationFrame];
      }
    },

    play: function(name,priority) {
      var entity = this.entity,
          p = entity.p;
      priority = priority || 0;
      if(name != p.animation && priority >= p.animationPriority) {
        p.animation = name;
        p.animationChanged = true;
        p.animationTime = 0;
        p.animationFrame = 0;
        p.animationPriority = priority;
        entity.trigger('anim');
        entity.trigger('anim.' + p.animation);
      }
    }
  
  });

  Q.component('viewport',{
    added: function() {
      this.entity.on('predraw',this,'predraw');
      this.entity.on('draw',this,'postdraw');
      this.x = 0,
      this.y = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      this.centerX = Q.width/2;
      this.centerY = Q.height/2;
      this.scale = 1;
    },

    extend: {
      follow: function(sprite,directions) {
        this.off('step',this.viewport,'follow');
        this.viewport.directions = directions || { x: true, y: true };
        this.viewport.following = sprite;
        this.on('step',this.viewport,'follow');
        this.viewport.follow();
      },

      unfollow: function() {
        this.off('step',this.viewport,'follow');
      },

      centerOn: function(x,y) {
        this.viewport.centerOn(x,y);
      }
    },

    follow: function() {
      this.centerOn(
                    this.directions.x ? 
                      this.following.p.x + this.following.p.w/2 - this.offsetX :
                      undefined,
                    this.directions.y ?
                     this.following.p.y + this.following.p.h/2 - this.offsetY :
                     undefined
                  );
    },

    offset: function(x,y) {
      this.offsetX = x;
      this.offsetY = y;
    },

    centerOn: function(x,y) {
      if(x !== void 0) {
        this.centerX = x;
        this.x = this.centerX - Q.width / 2 / this.scale;
      }
      if(y !== void 0) { 
        this.y = this.centerY - Q.height / 2 / this.scale;
        this.centerY = y;
      }

    },

    predraw: function() {
      Q.ctx.save();
      Q.ctx.translate(Math.floor(Q.width/2),Math.floor(Q.height/2));
      Q.ctx.scale(this.scale,this.scale);
      Q.ctx.translate(-Math.floor(this.centerX), -Math.floor(this.centerY));
    },

    postdraw: function() {
      Q.ctx.restore();
    }
  });

  Q.Sprite.extend("Repeater",{
    init: function(props) {
      this._super(_(props).defaults({
        speedX: 1,
        speedY: 1,
        repeatY: true,
        repeatX: true
      }));
      this.p.repeatW = this.p.repeatW || this.p.w;
      this.p.repeatH = this.p.repeatH || this.p.h;
    },

    draw: function(ctx) {
      var p = this.p,
          asset = this.asset(),
          sheet = this.sheet(),
          scale = this.parent.viewport.scale,
          viewX = this.parent.viewport.x,
          viewY = this.parent.viewport.y,
          offsetX = p.x + viewX * this.p.speedX,
          offsetY = p.y + viewY * this.p.speedY,
          curX, curY, startX;
      if(p.repeatX) {
        curX = Math.floor(-offsetX % p.repeatW);
        if(curX > 0) { curX -= p.repeatW; }
      } else {
        curX = p.x - viewX;
      }
      if(p.repeatY) {
        curY = Math.floor(-offsetY % p.repeatH);
        if(curY > 0) { curY -= p.repeatH; }
      } else {
        curY = p.y - viewY;
      }
      startX = curX;
      while(curY < Q.height / scale) {
        curX = startX;
        while(curX < Q.width / scale) {
          if(sheet) {
            sheet.draw(ctx,Math.floor(curX + viewX), Math.floor(curY + viewY),p.frame);
          } else {
            ctx.drawImage(asset,Math.floor(curX + viewX),Math.floor(curY + viewY));
          }
          curX += p.repeatW;
          if(!p.repeatX) { break; }
        }
        curY += p.repeatH;
        if(!p.repeatY) { break; }
      }
    }
  });


};
