# Angulocity
####Animating [AngularJS](https://angularjs.org) with the power of [VelocityJS](https://velocityjs.org) without having to deal with ngAnimation.
---
Angulocity is an effort to make better sense of doing animations with Angular. Add an animation to any element. Trigger using normal angular expressions. Animate groups of elements. Create custom animation sequences thanks to VelocityJS.

## Requirements
* AngularJS 1.2+
* [Velocity](https://github.com/julianshapiro/velocity)
* [Velocity UI Pack](https://github.com/julianshapiro/velocity) (Optional)

## Usage
Angulocity contains five base directives that allow us to perform all sorts of animation.
#### ngvFade and ngvSlide
`ngv-fade` and `ngv-slide` are simple animated replacements for Angular's `ng-show` directive. Initial page load will act like a normal `ng-show` until the first value switch.

```html
<div ngv-slide="status.showSomething()">Something</div>
<img ngv-fade="option.somethingVisible" src="pic.jpg">
```

Velocity animations can be called with additional options. The following options are described in the Velocity [docs](http://julian.com/research/velocity/#arguments)

```js
{
  /* Velocity's default options */
  duration: 400,
  easing: 'swing',
  queue: '',
  begin: undefined,
  progress: undefined,
  complete: undefined,
  display: undefined,
  visibility: undefined,
  loop: false,
  delay: false,
  mobileHA: true,
  /* options specific to group animations */
  stagger: false,
  drag: false
};
```
Each option has a corresponding directive attribute which uses the same naming convention simply prepended with `ngv-`. This example shows how easy changing a few options can be.

```html
<div ngv-slide="status.showSomething()" ngv-duration="slow" ngv-easing="easeInOutQuart" ngv-delay="100">Show Something</div>
```
Some 'Out' animations like 'fadeOut' normally removes the animated element from the DOM. The next example preserves the space occupied by the element when fading out.
```html
<img ngv-fade="someScopeProp || someScopeMethod()" ngv-display="inherited" src="some-pic.png">
```
### ngvClass
`ngv-class` attaches an Angulocity specific class to the element which can be used by other Angulocity directives and the `$ngvAnimator` service to isolate animations within a specific ***ngvClass***
```html
<div>
  <p ngv-class="oddp">Paragraph 1</p>
  <p>Paragraph 2</p>
  <p ngv-class="oddp">Paragraph 3</p>
</div>
```
### ngvCollection
`ngv-collection` allows animation to be performed to a group of child elements. This directive accepts basic selectors and a special ***ngvClass*** selector to identify which child elements to perform the animations on.

`<div ngv-collection="p"...>...</div>` selects all `<p>` within the directive element

`<div ngv-collection="ngv:myClass"...>...</div>` selects all elements with a `ngv-class="myClass"`

***ngvCollection*** introduces three additional directive attributes `ngv-effect`, `ngv-toggle`, and `ngv-animate` to completely describe the animation.

`ngv-toggle` accepts any boolean expression where a truthy value performs the 'In' animation and a falsy value performs the 'Out' animation.

`ngv-animate` accepts any boolean expression to perform an animation. But unlike `ngv-toggle`, it only performs the animation on the transition to a truthy value.

`ngv-effect` accepts named [Velocity UI Pack](http://julian.com/research/velocity/#uiPack) effects without the 'In' and 'Out' suffix when used with `ngv-toggle` and the complete effect name when used with `ngv-animate`
`ngv-effect` also accepts a map of *CSS properties and values* as described in the Velocity [docs](http://julian.com/research/velocity/#arguments)

Let's update the previous ***ngvClass*** example to use ***ngvCollection***
```html
<div ngv-collection="ngv:oddp" ngv-effect="transition.flipY" ngv-toggle="status.showOddPs()">
  <p ngv-class="oddp">Paragraph 1</p>
  <p>Paragraph 2</p>
  <p ngv-class="oddp">Paragraph 3</p>
</div>
```
***If no selector is specified for ngvCollection, animation will be performed on all first level children***

### ngvElement
`ngv-element` has the same usage as `ngv-collection` but performs the animation only on one element. This allows for use of Velocity UI Pack effects and custom effects on any single element.

Assigning a value to `ngv-element` adds an ***ngvClass*** to that element with that value.

This example has the exact same effect as ***ngvFade***
```html
<div ngv-element ngv-effect="fade" ngv-toggle="status.showSomething()">Something</div>
```
This example uses ***ngvCollection*** to perform group animations and ***ngvElement*** to animate a single element in the group

```html
<div ngv-collection="ngv:oddp" ngv-effect="transition.flipY" ngv-toggle="status.showOddPs()" ngv-stagger="100" ngv-drag="true">
  <p ngv-element="oddp" ngv-effect="callout.bounce" ngv-animate="status.calloutP()">Paragraph 1</p>
  <p>Paragraph 2</p>
  <p ngv-class="oddp">Paragraph 3</p>
</div>
```
