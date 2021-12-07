import React, { useEffect, useCallback, useState } from 'react';
import { Link, Redirect, useRouteMatch } from 'react-router-dom';

import { t } from '@lingui/macro';
import { Button, ExpandableSection } from '@patternfly/react-core';
import { CaretLeftIcon } from '@patternfly/react-icons';
import { CardBody, CardActionsRow } from 'components/Card';
import ContentError from 'components/ContentError';
import ContentLoading from 'components/ContentLoading';
import { DetailList } from 'components/DetailList';
import RoutedTabs from 'components/RoutedTabs';
import { SettingsAPI } from 'api';
import useRequest from 'hooks/useRequest';
import { useConfig } from 'contexts/Config';
import { useSettings } from 'contexts/Settings';
import { SettingDetail } from '../../shared';
import { sortNestedDetails } from '../../shared/settingUtils';

function filterByPrefix(data, prefix) {
  return Object.keys(data)
    .filter((key) => key.includes(prefix))
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});
}

function LDAPDetail() {
  const { me } = useConfig();
  const { GET: options } = useSettings();
  const {
    path,
    params: { category },
  } = useRouteMatch('/settings/ldap/:category/details');

  const {
    isLoading,
    error,
    request,
    result: LDAPDetails,
  } = useRequest(
    useCallback(async () => {
      const { data } = await SettingsAPI.readCategory('ldap');

      const mergedData = {};
      Object.keys(data).forEach((key) => {
        mergedData[key] = options[key];
        mergedData[key].value = data[key];
        mergedData[key].isAdvanced = key.includes('_CONNECTION_OPTIONS');
      });

      const ldap1 = filterByPrefix(mergedData, 'AUTH_LDAP_1_');
      const ldap2 = filterByPrefix(mergedData, 'AUTH_LDAP_2_');
      const ldap3 = filterByPrefix(mergedData, 'AUTH_LDAP_3_');
      const ldap4 = filterByPrefix(mergedData, 'AUTH_LDAP_4_');
      const ldap5 = filterByPrefix(mergedData, 'AUTH_LDAP_5_');
      const ldapDefault = { ...mergedData };
      Object.keys({ ...ldap1, ...ldap2, ...ldap3, ...ldap4, ...ldap5 }).forEach(
        (keyToOmit) => {
          delete ldapDefault[keyToOmit];
        }
      );

      return {
        default: sortNestedDetails(ldapDefault),
        1: sortNestedDetails(ldap1),
        2: sortNestedDetails(ldap2),
        3: sortNestedDetails(ldap3),
        4: sortNestedDetails(ldap4),
        5: sortNestedDetails(ldap5),
      };
    }, [options]),
    {
      default: null,
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
    }
  );

  useEffect(() => {
    request();
  }, [request]);

  const [ isExpanded, setIsExpanded ] = useState(false);
  const baseURL = '/settings/ldap';
  const tabsArray = [
    {
      name: (
        <>
          <CaretLeftIcon />
          {t`Back to Settings`}
        </>
      ),
      link: `/settings`,
      id: 99,
    },
    {
      name: t`Default`,
      link: `${baseURL}/default/details`,
      id: 0,
    },
    {
      name: t`LDAP1`,
      link: `${baseURL}/1/details`,
      id: 1,
    },
    {
      name: t`LDAP2`,
      link: `${baseURL}/2/details`,
      id: 2,
    },
    {
      name: t`LDAP3`,
      link: `${baseURL}/3/details`,
      id: 3,
    },
    {
      name: t`LDAP4`,
      link: `${baseURL}/4/details`,
      id: 4,
    },
    {
      name: t`LDAP5`,
      link: `${baseURL}/5/details`,
      id: 5,
    },
  ];

  if (!Object.keys(LDAPDetails).includes(category)) {
    return <Redirect from={path} to={`${baseURL}/default/details`} exact />;
  }

  function toggleExpanded() {
    setIsExpanded(!isExpanded);
  }

  return (
    <>
      <RoutedTabs tabsArray={tabsArray} />
      <CardBody>
        <>
          {isLoading && <ContentLoading />}
          {!isLoading && error && <ContentError error={error} />}
          {!isLoading && !Object.values(LDAPDetails)?.includes(null) && (
            <DetailList>
              {LDAPDetails[category].filter(e => !e[1].isAdvanced).map(([key, detail]) => (
                <SettingDetail
                  key={key}
                  id={key}
                  helpText={detail?.help_text}
                  label={detail?.label}
                  type={detail?.type}
                  unit={detail?.unit}
                  value={detail?.value}
                />
              ))}
            </DetailList>
          )}
        </>
        {me?.is_superuser && (
        <>
          <ExpandableSection
                toggleText={t`Advanced Settings`}
                onToggle={toggleExpanded}
                isExpanded={isExpanded}
            >
          {!isLoading && !Object.values(LDAPDetails)?.includes(null) && (
            <DetailList>
                  {LDAPDetails[category].filter(e => e[1].isAdvanced).map(([key, detail]) => (
                    <SettingDetail
                      key={key}
                      id={key}
                      helpText={detail?.help_text}
                      label={detail?.label}
                      type={detail?.type}
                      unit={detail?.unit}
                      value={detail?.value}
                    />
                  ))}
            </DetailList>
                  )}
          </ExpandableSection>
          <CardActionsRow>
            <Button
              ouiaId="ldap-detail-edit-button"
              aria-label={t`Edit`}
              component={Link}
              to={`${baseURL}/${category}/edit`}
            >
              {t`Edit`}
            </Button>
          </CardActionsRow>
            </>
        )}
      </CardBody>
    </>
  );
}

export default LDAPDetail;
