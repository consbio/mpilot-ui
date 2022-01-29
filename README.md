# MPilot Model Viewer

Mpilot UI is a JavaScript library for visualizing MPilot models. MPilot UI is implemented using Svelte and provides a 
Svelte component, as well as a vanilla JavaScript API.

## Using with Svelte

You can use the `ModelDiagram` component to place a model visualization in your Svelte application. In order to do this,
you will first have to create a program object from model source.

```javascript
import { Program } from 'mpilot/lib'
const program = Program.fromSource(modelSource)  
```

With the program object, you can create the diagram in your Svelte component.

```sveltehtml
<script>
  import ModelDiagram from 'mpilot-ui/lib/components/ModelDiagram'
</script>

<ModelDiagram {program} />
```

In addition to `program`, the `ModelDiagram` component takes three other props that affect the visualization behavior.

**Props**

* `program` -- The MPilot program object
* `values` -- An object mapping nodes in the model to values (e.g., when the user clicks a location on a map). See 
below for the object format.
* `labels` -- An object mapping nodes in the model to custom labels. See below for the object format.
* `mode` -- The diagram mode. Can be either 'full' or 'narrow' (default). Narrow mode only shows part of the diagram at 
a time, adjusting which nodes are visible as the user explores the model.

**Values object schema**

```javascript
{
  '<node result name>': {
    value: '<numerical value>',
    label: '<value label>',
    color: '<value color>'
  }
}
```

**Labels object schema**

```javascript
{
  '<node result name>': '<label>'
}
```

## Using with vanilla JavaScript

TODO...
