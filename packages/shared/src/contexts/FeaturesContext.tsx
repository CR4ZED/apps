import React, { ReactElement, ReactNode, useContext, useMemo } from 'react';
import { IFlags } from 'flagsmith';
import {
  Features,
  getFeatureValue,
  getNumberValue,
  isFeaturedEnabled,
} from '../lib/featureManagement';
import {
  InAppNotificationPosition,
  OnboardingFilteringTitle,
  OnboardingFiltersLayout,
  OnboardingV2,
} from '../lib/featureValues';
import { OnboardingStep } from '../components/onboarding/common';
import { getCookieFeatureFlags, updateFeatureFlags } from '../lib/cookie';
import { isPreviewDeployment } from '../lib/links';

interface Experiments {
  onboardingMinimumTopics?: number;
  onboardingSteps?: OnboardingStep[];
  onboardingFiltersLayout?: OnboardingFiltersLayout;
  popularFeedCopy?: string;
  canSubmitArticle?: boolean;
  submitArticleSidebarButton?: string;
  submitArticleModalButton?: string;
  showCommentPopover?: boolean;
  inAppNotificationPosition?: InAppNotificationPosition;
  hasSquadAccess?: boolean;
  showHiring?: boolean;
  onboardingV2?: OnboardingV2;
  onboardingFilteringTitle?: OnboardingFilteringTitle;
}

export interface FeaturesData extends Experiments {
  flags: IFlags;
  isFlagsFetched?: boolean;
  isFeaturesLoaded?: boolean;
}

const FeaturesContext = React.createContext<FeaturesData>({ flags: {} });
export default FeaturesContext;

export interface FeaturesContextProviderProps
  extends Pick<FeaturesData, 'flags' | 'isFlagsFetched' | 'isFeaturesLoaded'> {
  children?: ReactNode;
}

const getFeatures = (flags: IFlags): FeaturesData => {
  const steps = getFeatureValue(Features.OnboardingSteps, flags);
  const onboardingSteps = (steps?.split?.('/') || []) as OnboardingStep[];
  const minimumTopics = getFeatureValue(
    Features.OnboardingMinimumTopics,
    flags,
  );

  return {
    flags,
    onboardingSteps,
    onboardingMinimumTopics: getNumberValue(minimumTopics, 0),
    onboardingFiltersLayout: getFeatureValue(
      Features.OnboardingFiltersLayout,
      flags,
    ),
    popularFeedCopy: getFeatureValue(Features.PopularFeedCopy, flags),
    showCommentPopover: isFeaturedEnabled(Features.ShowCommentPopover, flags),
    canSubmitArticle: isFeaturedEnabled(Features.SubmitArticle, flags),
    submitArticleSidebarButton: getFeatureValue(
      Features.SubmitArticleSidebarButton,
      flags,
    ),
    submitArticleModalButton: getFeatureValue(
      Features.SubmitArticleModalButton,
      flags,
    ),
    inAppNotificationPosition: getFeatureValue(
      Features.InAppNotificationPosition,
      flags,
    ),
    onboardingV2: getFeatureValue(Features.OnboardingV2, flags),
    onboardingFilteringTitle: getFeatureValue(
      Features.OnboardingFilteringTitle,
      flags,
    ),
    hasSquadAccess: isFeaturedEnabled(Features.HasSquadAccess, flags),
    showHiring: isFeaturedEnabled(Features.ShowHiring, flags),
  };
};

export const FeaturesContextProvider = ({
  isFeaturesLoaded,
  isFlagsFetched,
  children,
  flags,
}: FeaturesContextProviderProps): ReactElement => {
  const featuresFlags: FeaturesData = useMemo(() => {
    const features = getFeatures(flags);
    const props = { isFeaturesLoaded, isFlagsFetched };

    if (!isPreviewDeployment) {
      return { ...features, ...props };
    }

    const featuresCookie = getCookieFeatureFlags();
    const updated = updateFeatureFlags(flags, featuresCookie);
    const result = getFeatures(updated);

    globalThis.getFeatureKeys = () => Object.keys(flags);

    return { ...result, ...props };
  }, [flags, isFeaturesLoaded, isFlagsFetched]);

  return (
    <FeaturesContext.Provider value={featuresFlags}>
      {children}
    </FeaturesContext.Provider>
  );
};

export const useFeaturesContext = (): FeaturesData =>
  useContext(FeaturesContext);
