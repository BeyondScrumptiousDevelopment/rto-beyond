import category from './category'
import configuration from './configuration'
import decoration from './decoration'
import design from './design'
import { extra, filling, flavour, frosting } from './options'
import settings from './settings'
import cakeImage from './objects/cakeImage'
import { fillingGroup, flavourGroup, frostingGroup } from './objects/optionGroup'
import portions from './objects/portions'
import pricingRule from './objects/pricingRule'

export const schemaTypes = [
  // documents
  settings,
  design,
  category,
  configuration,
  flavour,
  filling,
  frosting,
  extra,
  decoration,
  // objects
  pricingRule,
  cakeImage,
  portions,
  flavourGroup,
  fillingGroup,
  frostingGroup,
]

/** Only one settings document may exist. */
export const SINGLETONS = new Set(['cakeSiteSettings'])
