## Declarative View/Template Driven Animations in AngularJS

### What's wrong with Angular animations

Looking at some solutions to adding aimation to my AngularJS project,I've come to a conclusion
that either I'm too lazy to just do it the *Angular* way or I just might have an idea worth pursuing.

##### How Angular does animation (how I'm seeing it)...

    1.  Define your animations through CSS or javascript (check)
    2.  Add animation classes to things you want to animate (check)
    3.  Add actions to those things like showing or hiding with `ng-show` (check)
    4.  Be amazed (no check)

OK. Maybe that's too simple of an example... But I want to animate other things too...

> Well, animation is supported by native directives and many popular modules

OK. Let me try it again...

##### How Angular does animation part 2 (again how I'm seeing it)...

    1.  Define you animations through CSS or javascript
        - Do I really need to make 10 things just to define my animation? (exaggeration)...
        > YES.
        - I have to make a separate css for different actions like enter and leave?
        > YES.
        - OK. :( ... (check)
    2.  Add animation classes to things you want to animate (check)
    3.  Write animation aware directives so your own directives can animate too (hmm. check)
    4.  Be amazed (no check)
    
I'm must be very hard to please... I really want to do more sophisticated animations at any given
time in my application's lifecycle. Like notifying a user when something is going on in the back
end.

> Easy. Hide something animatable. Show. Then *viola*.

I want the same notification to animate differently depending on the situation.

> Make another one with a different animation and use logic to show the right one at the right time.
> Or you can add and remove classes to the element to animate them with whatever animation you want.
> Even better, you can force an element to animate with custom animations you define in real time.

Oh. That's sounds interesting. How do I add and remove these classes or force and element to animate?

> Just add it in your controller logic

Wait... What?!

#### My Conclusion

Sad to say it, but most of the animation that impresses me can really only be done with good old program
logic to drive the animation. As great as Angular is, it just doesn't have the propper solution to deliver
sophisticated on demand animation without having to break one of its important rules -- ***no DOM manipulation
within the controller*** ...at least not directly.

### How this idea came about?

Being more of a developer than a desiger, I hadn't had the foundation to deal heavily in CSS3 animations. And
working on a project that required IE8 compatibility drove the last nail on the *no CSS3 animations* coffin.
However, a little bit of animation was necessary for the UI/UX developed for the project for it to make sense.

The solution to this problem came about as an attribute directive that can be attached to elements or other directives wherein the logic to drive the animation was derived from a value assigned to it.

```html
<div my-directive="expression">...</div>
```

This essentially removed any code in my controllers that would directly manipulate the DOM to drive an animation. The animation could be initiated by an expression evaluated within the scope. Which meant that I don't have to necessarily assign a scope variable to animate something. It could be just from any value existing in the scope that coincides with when the animation may occur such as when something needs to show or hide.

Immediately it became a quick replacement for `ng-show` which allowed me to animate the element's visibility. From there the idea grew.

### How about other existing solutions?

At the time the idea came about, I hadn't really looked for other solutions which in some sense allowed me to develop my ideas detached from any external influences. For me, the idea made sense and it worked well enough for my needs at the time.

However, after consequently looking at other options for animation in Angular as a means of validating my idea. I realized there's not one (that I've found) other solution followed the principles I though made sense to me. Here are the notable solutions.

#### [ngFx](https://github.com/Hendrixer/ngFx) - javascript animation using [GSAP](http://greensock.com/gsap) engine

> ##### Highlights
> * Declarative - uses class names to define animation
> * Performant - thanks to the GSAP library
> * Customizable - definable custom animations

#### [angular-velocity](https://github.com/cgwyllie/angular-velocity) - a small utility to add [Velocity.js](https://velocityjs.org) animations to Angular

> ##### Highlights
> * Delcarative - uses class names to define animation and attributes to set options
> * Performant - thanks to VelocityJS library
> * Customizable - custom animations through VelocityJS

#### [velocity-ui-angular](https://github.com/rosslavery/velocity-ui-angular) - VelocityJS plugin for Angular

> ##### Highlights
> * Declarative - uses class names to define animation
> * Performant - thanks again to VelocityJS library
> * Customizable - custom animations through VelocityJS

#### Limitations

These solutions are great and they would have solved my problem when I first required animation in my Angular apps. However, there's a lot that could still be improved which I don't quite see how these solutions may could implement elegantly into their existing API.

### The Gist

1.  Javascript animation is a [better](http://css-tricks.com/myth-busting-css-animations-vs-javascript/) solution ***overall*** for developing animation rich content because it's programmatic and not limited to the browser's capabilities or the language defined by css.
2.  Great animation requires targeted and complex logic to execute an therefore implies a significant use of javascript code and DOM manipulation.
3.  Separation of Concerns states that a **View** cannot perform **Controller** logic and a **Controller** cannot enforce **View** logic. Hence the reason why the **Controller** should not access DOM directly.
4.  I want a greater amount of animation capabilities in my Angular app without breaking #3.

#### My Implementation

The first and obvious part of my solution is to use pre-existing javascript animation libraries, specifically [VelocityJS](https://velocityjs.org) for its performance and capabilities. Velocity has the ability to perform complicated multi element animations through the use of sequences. This ability will allow us to define our animations during configuration. If we must, we can use class names for targetted animation sequences which can then be attributed to a single or specific element in the view. This animation sequence can later then be performed together through a single call. This keeps out a large chunk of our animation logic, even complex ones, apart from our controller logic and leaves us with just one thing. How do we initiate these animations?

The solution ngAnimate offers us is to hook these animations to one of its events. This is very limitting and from my perspective the primary reason why Angular animations just can't match with what others are able to create without a framework. So part of the solution is to ditch ngAnimate and expose a wider set of events to initiate an animation. This includes, and is probably should not be limitted to, ***browser events***, ***Angular events propagated with $broadcast and $emit***, ***expressions***, and the defacto ***ngAnimate events***.  Being able to capture any of these events from the ***View** and initiate an animation would completely decouple the ***View*** from the ***Controller*** allowing us to have full Separation of Concern when dealing with animations.

#### Is exposing these events *Angular*?

It is! ...for a variety of reasons. Let's look at them individually.

##### Browser Events

>   Browser events are resultant of a user's interaction with the *View*. There is no reason to say that the event needs to be processed by a *Controller* in order for some animation to occur. In fact the *Controller* should not even be used to process this event, only directives. So yes, browser events, intercepted by an animation directive is perfectly *Angular*.

##### $boradcast and $emmit ($scope events)

>   Many Angular users are familiar with these methods for delivering messages cross module or cross controller. These events act like radio frequencies in that they propagate throughout. In many cases `$rootScope.$broadcast()` is preferred to guarantee delivery of event to all scopes. There's no rule broken if we listen to these events.

##### [Angular Expressions](https://docs.angularjs.org/guide/expression)

>   These expressions are different to Javascript expression in that they are only evaluated within their scope. Simply enough they have to be *Angular* because all Angular directives that deal with page layout use them. Triggering animations is no different.

##### ngAnimate Events

>   No need to cover this.

## Angulocity

The result of all this is [Angulocity](https://github.com/johnrcui/angulocity), my ***Declarative View Driven Animation*** module.

### How is it ***Declarative***?

Animations are declared explicity within the document via several attribute directives and their helpers. An animation and its trigger can be defined simply with a single directive or expressively through the use of directive attributes. Since the module uses VelocityJS animation engine, any animation that works with it can be explicitly defined as a set of attributes and values.

In comparison using class name combinations to define an animation, using attribute value method in my opinion is considerably more legible than class names in that it clearly indicates your intentions -- which in all case is assigning a value. For example:

```html
<div ngv-toggle="expression" ngv-effect="my_effect" ngv-duration="800" ngv-once>...</div>
```
compared to

```html
<div class="my-class some-other-class maybe-another-class fx-fade-down fx-easing-bounce fx-speed-800 fx-trigger">...<div>
```
At some point having that many lengthy class names start to look cluttered and confusing.

Unlike [angular-velocity](https://github.com/cgwyllie/angular-velocity), Angulocity defers from assigning objects to attributes. Instead options are broken down to their individual parts and are assigned through individual attributes which make it more akin to a traditional html element attribute.

### How is it ***View Driven***?

Simply, these animations do not rely on what happens on the controller to define and initiate it. The entire animation event is defined explicitly on the view and does not communicate in any way back to the controller except perhaps as a `$broadcast` event. The full animation capabilities of the VelocityJS engine can be simplified down to a set of element attributes that even non-programmers can use.

## Final Thoughts

I hope I have convinced some of you to accept my notion of animating AngularJS. There might be some die-hard ngAnimate guys that will hate me for this, but I'm not planning to go back. Thanks for the interest in this subject matter and please let me know what you think ...but be nice :).
