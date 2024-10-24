import { ArrowDropDown } from "@mui/icons-material";
import { Autocomplete, CircularProgress, createFilterOptions, TextField } from "@mui/material";
import { ApiGetCall } from "../../api/ApiCall";
import { useEffect, useState } from "react";
import { useSettings } from "../../hooks/use-settings";
import { getCippError } from "../../utils/get-cipp-error";

export const CippAutoComplete = (props) => {
  const {
    size,
    api,
    label,
    multiple = true,
    creatable = true,
    defaultValue,
    value,
    placeholder,
    disableClearable,
    disabled,
    name,
    options = [],
    onChange,
    required = false,
    sx,
    ...other
  } = props;
  const filter = createFilterOptions();
  const [usedOptions, setUsedOptions] = useState(options);
  const [getRequestInfo, setGetRequestInfo] = useState({ url: "", waiting: false, queryKey: "" });

  const actionGetRequest = ApiGetCall({
    ...getRequestInfo,
  });

  const currentTenant = api?.tenantFilter ? api.tenantFilter : useSettings().currentTenant;
  useEffect(() => {
    if (api) {
      setGetRequestInfo({
        url: api.url,
        data: {
          ...(!api.excludeTenantFilter ? { TenantFilter: currentTenant } : null),
          ...api.data,
        },
        waiting: true,
        queryKey: api.queryKey,
      });
    }

    if (actionGetRequest.isSuccess) {
      const dataToMap = api.dataKey ? actionGetRequest.data?.[api.dataKey] : actionGetRequest.data;
      if (!Array.isArray(dataToMap)) {
        setUsedOptions([
          {
            label: "Error: The API returned data we cannot map to this field",
            value: "Error: The API returned data we cannot map to this field",
          },
        ]);
        return;
      }
      const convertedOptions = dataToMap.map((option) => {
        const addedFields = {};
        if (api.addedField) {
          Object.keys(api.addedField).forEach((key) => {
            addedFields[key] = option[api.addedField[key]];
          });
        }
        return {
          label:
            typeof api.labelField === "function" ? api.labelField(option) : option[api.labelField],
          value:
            typeof api.valueField === "function" ? api.valueField(option) : option[api.valueField],
          addedFields: addedFields,
        };
      });
      setUsedOptions(convertedOptions);
    }
    if (actionGetRequest.isError) {
      setUsedOptions([{ label: getCippError(actionGetRequest.error), value: "error" }]);
    }
  }, [api, actionGetRequest.data]);
  const rand = Math.random().toString(36).substring(5);
  return (
    <Autocomplete
      key={`${defaultValue}-${rand}`}
      disabled={disabled || actionGetRequest.isFetching}
      popupIcon={
        props.isFetching || actionGetRequest.isFetching ? (
          <CircularProgress color="inherit" size={20} />
        ) : (
          <ArrowDropDown />
        )
      }
      isOptionEqualToValue={(option, value) => option.value === value.value}
      value={typeof value === "string" ? { label: value, value: value } : value}
      filterSelectedOptions
      disableClearable={disableClearable}
      multiple={multiple}
      fullWidth
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        if (params.inputValue !== "" && creatable) {
          filtered.push({ label: `Add option: ${params.inputValue}`, value: params.inputValue });
        }
        //from the added component remove the "Add option" text
        return filtered;
      }}
      size="small"
      defaultValue={
        typeof defaultValue === "string"
          ? { label: defaultValue, value: defaultValue }
          : defaultValue
      }
      name={name}
      onChange={
        onChange
          ? (event, newValue) => {
              if (onChange) {
                onChange(newValue, newValue?.addedFields);
              }
            }
          : undefined
      }
      options={api ? usedOptions : options}
      getOptionLabel={(option) => option.label || "Label not found - Are you missing a labelField?"}
      sx={sx}
      renderInput={(params) => (
        <TextField
          variant="filled"
          placeholder={placeholder}
          required={required}
          label={label}
          {...params}
        />
      )}
    />
  );
};
