import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  buildEnquiryMessage,
  checkCollectionDate,
  checkCollectionTime,
  checkCustomerDetails,
  choicesFor,
  decorationsFor,
  earliestCollectionDate,
  emptyCustomer,
  estimate,
  extrasFor,
  formatPence,
  isComplete,
  leadTimeDays,
  OPTION_KINDS,
  resolveDesign,
  whatsappUrl,
  type Catalogue,
  type CustomerDetails,
  type Issue,
  type OptionKind,
} from '@bs/core'
import { btnPrimary, btnSecondary, card, eyebrow } from '../brand/ui'
import { DecorationsStep } from '../builder/DecorationsStep'
import { OptionsStep } from '../builder/OptionsStep'
import { PriceSummary } from '../builder/PriceSummary'
import { SizeStep } from '../builder/SizeStep'
import { STEPS, useSelection, type Step } from '../builder/useSelection'
import { Notice } from '../catalogue/Status'
import { Gallery } from '../design/Gallery'
import { CustomOrderCta } from '../enquiry/CustomOrderCta'
import { DetailsStep } from '../enquiry/DetailsStep'
import { Disclaimer } from '../enquiry/Disclaimer'
import { ReviewStep } from '../enquiry/ReviewStep'

const OPTION_FIELDS = new Set<string>(OPTION_KINDS)

export default function DesignPage({ catalogue }: { catalogue: Catalogue }) {
  const { slug = '' } = useParams()
  const design = catalogue.designs.find((d) => d.slug === slug)

  if (!design) {
    return (
      <div className="px-6 pt-40 pb-28 text-center">
        <h1 className="heading-font mb-6 text-4xl">Design not found</h1>
        <p className="mb-10 text-cream/70">This cake design isn't available at the moment.</p>
        <Link to="/" className={btnPrimary}>
          See all designs
        </Link>
      </div>
    )
  }
  return <DesignBuilder key={design.id} catalogue={catalogue} slug={slug} />
}

function DesignBuilder({ catalogue, slug }: { catalogue: Catalogue; slug: string }) {
  const design = catalogue.designs.find((d) => d.slug === slug)!
  const { settings } = catalogue
  const resolved = useMemo(() => resolveDesign(catalogue, design), [catalogue, design])
  const { selection, step, update } = useSelection(slug)
  const [personalisation, setPersonalisation] = useState<Record<string, { name?: string; age?: string }>>({})
  const [customer, setCustomer] = useState<CustomerDetails>(emptyCustomer)
  const [showErrors, setShowErrors] = useState(false)
  const builderHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = `${design.name} | Ready-to-Order Cakes | Beyond Scrumptious`
  }, [design.name])

  const fullSelection = { ...selection, personalisation }
  const result = estimate(catalogue, fullSelection)
  // The chosen size drives which steps can be shown, independently of the estimate:
  // an invalid decoration combination must not hide the step where it is fixed.
  const offeredSize = resolved.configurations.find((o) => o.available && o.configuration.id === selection.configurationId)
  const configId = offeredSize?.configuration.id ?? null
  const decorations = configId ? decorationsFor(resolved, configId) : null
  const extras = configId ? extrasFor(resolved.extras, configId) : []

  const now = new Date()
  const leadDays = leadTimeDays(catalogue, design)
  const earliest = earliestCollectionDate(catalogue, design, now)
  const dateCheck = checkCollectionDate(customer.collectionDate, catalogue, design, now)
  const timeValid = checkCollectionTime(customer.collectionTime)
  const detailIssues = checkCustomerDetails(customer)

  const incomplete: Issue[] = result.ok ? result.incomplete : []
  const errors: Issue[] = result.ok ? [] : result.errors
  const ready: Record<Step, boolean> = {
    size: !!configId,
    options: !!configId && !errors.some((e) => OPTION_FIELDS.has(e.field ?? '')) && !incomplete.some((i) => OPTION_FIELDS.has(i.field ?? '')),
    decorations: result.ok && !!configId && !incomplete.some((i) => i.field?.startsWith('personalisation')),
    details: detailIssues.length === 0 && dateCheck.ok && timeValid,
    review: true,
  }
  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const reachable = (i: number) => STEPS.slice(0, i).every((s) => ready[s.id])
  // Never show a later step than the selection supports (e.g. a shared URL).
  const effectiveIndex = reachable(stepIndex) ? stepIndex : STEPS.findIndex((s, i) => !ready[s.id] || i === stepIndex)
  const current = STEPS[effectiveIndex]!.id

  const goTo = (target: Step) => {
    setShowErrors(false)
    update({ step: target })
    requestAnimationFrame(() => {
      builderHeading.current?.focus({ preventScroll: true })
      builderHeading.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const next = () => {
    if (!ready[current]) {
      setShowErrors(true)
      return
    }
    const following = STEPS[effectiveIndex + 1]
    if (following) goTo(following.id)
  }

  const selectSize = (id: string) => {
    // Keep only selections that are still available in the new size, and pre-select defaults.
    const options: Record<OptionKind, string[]> = { flavour: [], filling: [], frosting: [] }
    for (const kind of OPTION_KINDS) {
      const available = choicesFor(resolved.groups[kind], id)
      const kept = selection.options[kind].filter((o) => available.some((c) => c.option.id === o))
      const defaults = available.filter((c) => c.isDefault).map((c) => c.option.id).slice(0, resolved.groups[kind].maxSelections)
      options[kind] = kept.length ? kept : defaults
    }
    const decos = decorationsFor(resolved, id)
    const decorationIds = selection.decorationIds.filter((d) => decos.optional.some((o) => o.decoration.id === d))
    const extraIds = new Set(extrasFor(resolved.extras, id).map((e) => e.extra.id))
    const keptExtras = Object.fromEntries(Object.entries(selection.extras).filter(([e]) => extraIds.has(e)))
    update({ size: id, options, decorationIds, extras: keptExtras })
  }

  const blocked = !settings.builderEnabled || !!settings.maintenanceNotice || !design.acceptingEnquiries
  const complete = isComplete(result)
  const message =
    complete && ready.details ? buildEnquiryMessage({ catalogue, estimate: result, customer }) : null

  const stepIssues = showErrors
    ? [...errors, ...incomplete].filter((i) => {
        if (current === 'size') return i.field === 'size' || i.code === 'chooseSize'
        if (current === 'options') return OPTION_FIELDS.has(i.field ?? '')
        if (current === 'decorations') return i.field === 'decorations' || i.field === 'extras' || i.field?.startsWith('personalisation')
        return false
      })
    : errors.filter((e) => e.field === 'decorations' || e.field === 'extras')

  const images = [design.mainImage, ...design.gallery].filter((i): i is NonNullable<typeof i> => !!i)
  const category = catalogue.categories.find((c) => c.id === design.categoryId)

  return (
    <>
      <div className="px-5 pt-32 pb-24 md:px-8 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <Link to="/" className="mb-8 inline-block text-sm uppercase tracking-[0.2em] text-mist/70 hover:text-cream">
            ← All designs
          </Link>

          <header className="reveal mb-10 max-w-3xl">
            {category && <p className={`${eyebrow} mb-4`}>{category.name}</p>}
            <h1 className="heading-font mb-4 text-4xl leading-tight md:text-6xl">{design.name}</h1>
            {design.shortDescription && <p className="text-lg leading-8 text-cream/70">{design.shortDescription}</p>}
          </header>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="min-w-0 space-y-10">
              <Gallery images={images} designName={design.name} />

              {(design.fullDescription || design.structureNotes || design.dietaryInfo || design.allergenInfo) && (
                <section aria-labelledby="about-heading" className="space-y-4 leading-7 text-cream/80">
                  <h2 id="about-heading" className="heading-font text-2xl text-cream">
                    About this design
                  </h2>
                  {design.fullDescription && <p className="whitespace-pre-line">{design.fullDescription}</p>}
                  {design.structureNotes && <p className="whitespace-pre-line">{design.structureNotes}</p>}
                  {design.dietaryInfo && (
                    <p>
                      <strong className="text-cream">Dietary:</strong> {design.dietaryInfo}
                    </p>
                  )}
                  {design.allergenInfo && (
                    <p>
                      <strong className="text-cream">Allergens:</strong> {design.allergenInfo}
                    </p>
                  )}
                  {settings.allergenInfoUrl && (
                    <p className="text-sm">
                      <a href={settings.allergenInfoUrl} className="underline hover:text-cream">
                        Read our allergen information
                      </a>
                    </p>
                  )}
                </section>
              )}

              {blocked ? (
                <Notice tone="warning">
                  {settings.maintenanceNotice ??
                    (settings.builderEnabled
                      ? `${design.name} is not taking enquiries at the moment.`
                      : 'The cake builder is not taking enquiries at the moment.')}
                </Notice>
              ) : (
                <section aria-labelledby="builder-heading" className={card}>
                  <h2 id="builder-heading" ref={builderHeading} tabIndex={-1} className="scroll-mt-32 outline-none">
                    <span className={`${eyebrow} block`}>
                      Step {effectiveIndex + 1} of {STEPS.length}
                    </span>
                    <span className="sr-only">: {STEPS[effectiveIndex]!.label}</span>
                  </h2>

                  <nav aria-label="Builder steps" className="mt-4 mb-8">
                    <ol className="flex gap-2 overflow-x-auto pb-1">
                      {STEPS.map((s, i) => {
                        const enabled = reachable(i)
                        const isCurrent = i === effectiveIndex
                        return (
                          <li key={s.id} className="shrink-0">
                            <button
                              type="button"
                              disabled={!enabled}
                              onClick={() => goTo(s.id)}
                              aria-current={isCurrent ? 'step' : undefined}
                              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
                                isCurrent
                                  ? 'bg-cream text-navy'
                                  : enabled
                                    ? 'border border-cream/30 text-cream hover:bg-cream/10'
                                    : 'border border-white/10 text-cream/30'
                              }`}
                            >
                              {i + 1}. {s.label}
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  </nav>

                  <div className="min-h-[12rem]">
                    {current === 'size' && (
                      <SizeStep offered={resolved.configurations} selectedId={configId} onSelect={selectSize} settings={settings} />
                    )}
                    {current === 'options' && configId && (
                      <OptionsStep
                        groups={resolved.groups}
                        configurationId={configId}
                        selected={selection.options}
                        onChange={(kind, ids) => update({ options: { [kind]: ids } })}
                        issues={stepIssues}
                      />
                    )}
                    {current === 'decorations' && decorations && (
                      <DecorationsStep
                        decorations={decorations}
                        extras={extras}
                        selectedDecorations={selection.decorationIds}
                        onDecorationsChange={(ids) => update({ decorationIds: ids })}
                        selectedExtras={selection.extras}
                        onExtrasChange={(e) => update({ extras: e })}
                        personalisation={personalisation}
                        onPersonalisationChange={setPersonalisation}
                        issues={stepIssues}
                      />
                    )}
                    {current === 'details' && (
                      <DetailsStep
                        customer={customer}
                        onChange={setCustomer}
                        earliest={earliest}
                        leadDays={leadDays}
                        dateCheck={dateCheck}
                        timeValid={timeValid}
                        issues={detailIssues}
                        showErrors={showErrors}
                        settings={settings}
                      />
                    )}
                    {current === 'review' &&
                      (complete && message ? (
                        <ReviewStep
                          catalogue={catalogue}
                          estimate={result}
                          customer={customer}
                          message={message}
                          url={whatsappUrl(settings.whatsappNumber, message)}
                        />
                      ) : (
                        <Notice tone="error">Some details are missing. Please go back and complete each step.</Notice>
                      ))}
                  </div>

                  {showErrors && stepIssues.length > 0 && current !== 'details' && (
                    <div className="mt-6">
                      <Notice tone="error">
                        <ul className="space-y-1">
                          {stepIssues.map((i, n) => (
                            <li key={n}>{i.message}</li>
                          ))}
                        </ul>
                      </Notice>
                    </div>
                  )}
                  {showErrors && current === 'details' && !ready.details && (
                    <div className="mt-6">
                      <Notice tone="error">Please check the highlighted details.</Notice>
                    </div>
                  )}

                  <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    {effectiveIndex > 0 ? (
                      <button type="button" className={btnSecondary} onClick={() => goTo(STEPS[effectiveIndex - 1]!.id)}>
                        Back
                      </button>
                    ) : (
                      <span />
                    )}
                    {current !== 'review' && (
                      <button type="button" className={btnPrimary} onClick={next}>
                        {current === 'details' ? 'Review enquiry' : 'Continue'}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {design.customRouting.showCustomCta && <CustomOrderCta catalogue={catalogue} design={design} compact />}
            </div>

            {!blocked && (
              <aside aria-labelledby="estimate-sidebar-heading" id="estimate" className={`lg:sticky lg:top-32 lg:self-start ${current === 'review' ? 'hidden lg:block' : ''}`}>
                <div className={`${card} space-y-6`}>
                  <h2 id="estimate-sidebar-heading" className="heading-font text-2xl">
                    Your estimate
                  </h2>
                  <PriceSummary result={result} customRequest={customer.customRequest} />
                  {current !== 'review' && (
                    <p className="text-xs leading-5 text-cream/60">
                      You'll review everything before sending. Sending an enquiry does not confirm an order.
                    </p>
                  )}
                  {current === 'review' && <Disclaimer text={settings.quotationDisclaimer} />}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {!blocked && result.ok && result.totalPence !== null && (
        <a
          href="#estimate"
          className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-white/10 bg-navy-deep/95 px-5 py-4 backdrop-blur lg:hidden"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-mist">Estimated total</span>
          <span className="heading-font text-2xl tabular-nums">{formatPence(result.totalPence)}</span>
        </a>
      )}
    </>
  )
}
