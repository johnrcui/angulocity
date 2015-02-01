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

Immediately it became a quick replacement for `ng-show` which allowed me to animate the element's visibility.

