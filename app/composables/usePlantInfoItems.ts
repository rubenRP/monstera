import type { Ref } from 'vue'
import type { Plant } from '#shared/types/database'
import type { PlantInfoGridItem } from '~/components/plants/detail/PlantInfoGridSection.vue'
import type { SpeciesDisplayIconTone } from '#shared/types/speciesDisplay'
import type { PlantHomeWeatherSnapshot } from '~/composables/usePlantHomeWeather'
import { usesWindowDistance } from '#shared/utils/sites/placement'
import {
  editSectionHash,
  type PlantFormSection
} from '#shared/utils/plants/plantCompleteness'
import { defaultPlantAgeUnit, formatPlantAge } from '#shared/utils/plants/formatPlantAge'

export function usePlantInfoItems(
  plant: Ref<Plant>,
  weather: Ref<PlantHomeWeatherSnapshot | null>
) {
  const { t } = useI18n()
  const { dateLocale } = useDateLocale()
  const {
    potSizeLabel,
    potMaterialLabel,
    substrateLabel
  } = usePlantEnumLabels()
  const { placementLabel, orientationLabel, luminosityLabel } = useSiteEnumLabels()

  const empty = computed(() => t('plants.missingInfo'))
  const editBase = computed(() => `/plants/${plant.value.id}/edit`)
  const addLabel = computed(() => t('plants.addInSettings'))

  function gridItem(
    label: string,
    sublabel: string,
    icon: string,
    iconTone?: SpeciesDisplayIconTone,
    missing = false,
    editTo?: string
  ): PlantInfoGridItem {
    return {
      label,
      sublabel,
      icon,
      iconTone,
      missing,
      editTo: missing ? editTo : undefined,
      editLabel: missing ? addLabel.value : undefined
    }
  }

  function missingItem(
    sublabel: string,
    icon: string,
    iconTone?: SpeciesDisplayIconTone,
    section?: PlantFormSection
  ): PlantInfoGridItem {
    const to = section
      ? `${editBase.value}#section-${editSectionHash(section)}`
      : editBase.value
    return gridItem(empty.value, sublabel, icon, iconTone, true, to)
  }

  function missingSiteField(
    sublabel: string,
    icon: string,
    iconTone?: SpeciesDisplayIconTone
  ): PlantInfoGridItem {
    const siteId = plant.value.site_id
    const to = siteId
      ? `/sites/${siteId}/edit`
      : `${editBase.value}#section-light`
    return gridItem(empty.value, sublabel, icon, iconTone, true, to)
  }

  const currentMonthLabel = computed(() => {
    return new Date().toLocaleDateString(dateLocale.value, { month: 'long' })
  })

  const lightItems = computed((): PlantInfoGridItem[] => {
    const site = plant.value.site
    const items: PlantInfoGridItem[] = []

    if (site?.luminosity) {
      items.push(gridItem(
        luminosityLabel(site.luminosity),
        t('plants.fieldLightLevel'),
        'i-lucide-sun',
        'amber'
      ))
    } else {
      items.push(site
        ? missingSiteField(t('plants.fieldLightLevel'), 'i-lucide-lightbulb', 'amber')
        : missingItem(t('plants.fieldLightLevel'), 'i-lucide-lightbulb', 'amber', 'light'))
    }

    items.push(
      site?.window_orientation
        ? gridItem(
            orientationLabel(site.window_orientation),
            t('plants.fieldOrientation'),
            'i-lucide-compass',
            'amber'
          )
        : site
          ? missingSiteField(t('plants.fieldOrientation'), 'i-lucide-compass', 'amber')
          : missingItem(t('plants.fieldOrientation'), 'i-lucide-compass', 'amber', 'light')
    )

    if (usesWindowDistance(site?.placement)) {
      items.push(
        plant.value.window_distance_cm != null
          ? gridItem(
              `${plant.value.window_distance_cm} ${t('common.cm')}`,
              t('plants.fieldWindowDistance'),
              'i-lucide-ruler',
              'amber'
            )
          : missingItem(t('plants.fieldWindowDistance'), 'i-lucide-ruler', 'amber', 'light')
      )
    }

    return items
  })

  const potItems = computed((): PlantInfoGridItem[] => [
    plant.value.pot_material
      ? gridItem(
          potMaterialLabel(plant.value.pot_material),
          t('plants.fieldPotType'),
          'i-lucide-flower-2',
          'brown'
        )
      : missingItem(t('plants.fieldPotType'), 'i-lucide-flower-2', 'brown', 'pot'),
    plant.value.pot_diameter_cm != null
      ? gridItem(
          `${plant.value.pot_diameter_cm} ${t('common.cm')}`,
          t('plants.fieldPotSize'),
          'i-lucide-circle',
          'brown'
        )
      : plant.value.pot_size
        ? gridItem(
            potSizeLabel(plant.value.pot_size),
            t('plants.fieldPotSize'),
            'i-lucide-circle',
            'brown'
          )
        : missingItem(t('plants.fieldPotSize'), 'i-lucide-circle', 'brown', 'pot'),
    gridItem(
      plant.value.has_drainage ? t('common.yes') : t('common.no'),
      t('plants.fieldDrainage'),
      'i-lucide-droplets',
      'blue'
    ),
    plant.value.substrate_type
      ? gridItem(
          substrateLabel(plant.value.substrate_type),
          t('plants.fieldSoilType'),
          'i-lucide-mountain',
          'brown'
        )
      : missingItem(t('plants.fieldSoilType'), 'i-lucide-mountain', 'brown', 'pot')
  ])

  const plantItems = computed((): PlantInfoGridItem[] => [
    plant.value.height_cm != null
      ? gridItem(
          `${plant.value.height_cm} ${t('common.cm')}`,
          t('plants.fieldPlantSize'),
          'i-lucide-ruler',
          'primary'
        )
      : missingItem(t('plants.fieldPlantSize'), 'i-lucide-sprout', 'primary', 'plant'),
    plant.value.age_years != null
      ? gridItem(
          formatPlantAge(
            plant.value.age_years,
            defaultPlantAgeUnit(plant.value.age_years, plant.value.age_unit),
            t
          ),
          t('plants.fieldPlantAge'),
          'i-lucide-cake',
          'primary'
        )
      : missingItem(t('plants.fieldPlantAge'), 'i-lucide-cake', 'primary', 'plant'),
    plant.value.species?.trim()
      ? gridItem(
          plant.value.species.trim(),
          t('plants.fieldPlantType'),
          'i-lucide-leaf',
          'primary'
        )
      : missingItem(t('plants.fieldPlantType'), 'i-lucide-leaf', 'primary', 'plant')
  ])

  function homeComfortItem(
    label: string | undefined,
    sublabel: string,
    icon: string
  ): PlantInfoGridItem {
    const w = weather.value
    const settingsLink = '/settings'
    const configureLabel = t('plants.configureHomeLocation')
    if (label && label !== empty.value) {
      return gridItem(label, sublabel, icon, 'blue')
    }
    return {
      ...gridItem(empty.value, sublabel, icon, 'blue', true),
      editTo: w?.hasLocation === false ? settingsLink : undefined,
      editLabel: w?.hasLocation === false ? configureLabel : addLabel.value
    }
  }

  const siteItems = computed((): PlantInfoGridItem[] => {
    const site = plant.value.site
    const w = weather.value
    const items: PlantInfoGridItem[] = [
      homeComfortItem(w?.indoorTempLabel, t('plants.fieldHomeIndoorTemp'), 'i-lucide-thermometer'),
      homeComfortItem(w?.humidityLabel, t('plants.fieldHomeHumidity'), 'i-lucide-droplets')
    ]

    items.push(
      site
        ? gridItem(
            placementLabel(site.placement),
            t('plants.fieldPlacementShort'),
            site.placement === 'indoor' ? 'i-lucide-home' : 'i-lucide-tree-pine',
            'primary'
          )
        : missingItem(t('plants.fieldPlacementShort'), 'i-lucide-home', 'primary', 'light')
    )

    if (site?.name) {
      items.push(gridItem(
        site.name,
        t('plants.fieldSite'),
        'i-lucide-map-pin',
        'neutral'
      ))
    }

    if (site) {
      items.push(gridItem(
        site.has_ceiling_cover ? t('common.yes') : t('common.no'),
        t('plants.fieldCeiling'),
        'i-lucide-umbrella',
        'neutral'
      ))
    }

    return items
  })

  const climateItems = computed((): PlantInfoGridItem[] => {
    const w = weather.value
    const settingsLink = '/settings'
    const configureLabel = t('plants.configureHomeLocation')
    return [
      gridItem(
        currentMonthLabel.value,
        t('plants.fieldCurrentMonth'),
        'i-lucide-calendar',
        'neutral'
      ),
      w
        ? gridItem(
            w.outdoorTempLabel,
            t('plants.fieldOutdoorTemp'),
            'i-lucide-thermometer-sun',
            'amber',
            w.outdoorTempLabel === empty.value,
            w.outdoorTempLabel === empty.value && !w.hasLocation ? settingsLink : `${editBase.value}`
          )
        : (() => {
            const item = missingItem(t('plants.fieldOutdoorTemp'), 'i-lucide-thermometer-sun', 'amber')
            return { ...item, editTo: settingsLink, editLabel: configureLabel }
          })(),
      w?.hasLocation
        ? gridItem(
            t('plants.locationConfigured'),
            t('plants.fieldClimate'),
            'i-lucide-map-pin',
            'primary'
          )
        : (() => {
            const item = missingItem(t('plants.fieldClimate'), 'i-lucide-map-pin', 'primary')
            return { ...item, editTo: settingsLink, editLabel: configureLabel }
          })()
    ]
  })

  return { lightItems, potItems, plantItems, siteItems, climateItems }
}
