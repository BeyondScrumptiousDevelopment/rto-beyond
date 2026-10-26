import type { StructureResolver } from 'sanity/structure'
import { DecorationOverview } from './components/DecorationOverview'

/** Owner-friendly Studio menu. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Cake Builder')
    .items([
      S.listItem()
        .title('Settings')
        .id('cakeSiteSettings')
        .child(S.document().schemaType('cakeSiteSettings').documentId('cakeSiteSettings').title('Cake Builder Settings')),
      S.divider(),
      S.documentTypeListItem('cakeDesign').title('Cake Designs'),
      S.documentTypeListItem('cakeCategory').title('Categories'),
      S.divider(),
      S.documentTypeListItem('cakeConfiguration').title('Sizes & Layers'),
      S.documentTypeListItem('cakeFlavour').title('Sponge Flavours'),
      S.documentTypeListItem('cakeFilling').title('Fillings'),
      S.documentTypeListItem('cakeFrosting').title('Frostings'),
      S.documentTypeListItem('cakeExtra').title('Extras'),
      S.divider(),
      S.listItem()
        .title('Decorations')
        .id('decorations')
        .child(
          S.list()
            .title('Decorations')
            .items([
              S.listItem()
                .title('Overview: which designs get what')
                .id('decorationOverview')
                .child(S.component(DecorationOverview).title('Decoration overview')),
              S.divider(),
              S.documentTypeListItem('cakeDecoration').title('All decorations'),
              S.listItem()
                .title('Included by default')
                .id('decIncluded')
                .child(
                  S.documentList()
                    .title('Included by default')
                    .filter('_type == "cakeDecoration" && active != false && defaultAppliesTo != "none" && defaultStatus == "included"'),
                ),
              S.listItem()
                .title('Optional paid add-ons by default')
                .id('decOptional')
                .child(
                  S.documentList()
                    .title('Optional add-ons by default')
                    .filter('_type == "cakeDecoration" && active != false && defaultAppliesTo != "none" && defaultStatus != "included"'),
                ),
              S.listItem()
                .title('Not applied by default')
                .id('decNone')
                .child(
                  S.documentList()
                    .title('Not applied by default')
                    .filter('_type == "cakeDecoration" && active != false && defaultAppliesTo == "none"'),
                ),
              S.listItem()
                .title('Disabled')
                .id('decDisabled')
                .child(S.documentList().title('Disabled decorations').filter('_type == "cakeDecoration" && active == false')),
            ]),
        ),
    ])
