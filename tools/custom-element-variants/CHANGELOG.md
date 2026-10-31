# custom-element-variants

## 1.0.0

### Major Changes

- ef5cdb9: Initial package release. `createVariantElement` creates a custom element that delegates
  to one of several variant elements chosen by its `variant` attribute, forwarding properties,
  methods, attributes, events, slots, and parts. `describeVariant` (from
  `custom-element-variants/manifest`) generates variant descriptors from a Custom Elements Manifest.
