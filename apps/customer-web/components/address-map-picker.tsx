'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { Crosshair, LoaderCircle, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { publicEnv } from '../lib/public-env';
import { Button } from './ui/button';

export type MapAddress = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  latitude: string;
  longitude: string;
};

type PickerStatus =
  | 'idle'
  | 'loading-map'
  | 'locating'
  | 'geocoding'
  | 'ready'
  | 'error';

const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 };

function componentValue(
  components: google.maps.GeocoderAddressComponent[],
  ...types: string[]
) {
  return (
    components.find((component) =>
      types.some((type) => component.types.includes(type)),
    )?.long_name ?? ''
  );
}

function parseAddress(
  result: google.maps.GeocoderResult,
  position: google.maps.LatLngLiteral,
): MapAddress {
  const components = result.address_components;
  const streetNumber = componentValue(components, 'street_number');
  const route = componentValue(components, 'route');
  const premise = componentValue(components, 'premise');
  const subpremise = componentValue(components, 'subpremise');
  const pointOfInterest = componentValue(
    components,
    'point_of_interest',
    'establishment',
  );
  const locality = componentValue(
    components,
    'sublocality_level_1',
    'sublocality',
    'neighborhood',
  );

  return {
    addressLine1:
      [subpremise, premise, streetNumber, route].filter(Boolean).join(', ') ||
      pointOfInterest ||
      result.formatted_address.split(',')[0],
    addressLine2: locality,
    city: componentValue(
      components,
      'locality',
      'postal_town',
      'administrative_area_level_2',
    ),
    state: componentValue(components, 'administrative_area_level_1'),
    pincode: componentValue(components, 'postal_code'),
    landmark:
      pointOfInterest && pointOfInterest !== premise ? pointOfInterest : '',
    latitude: position.lat.toFixed(8),
    longitude: position.lng.toFixed(8),
  };
}

export function AddressMapPicker({
  onAddress,
}: {
  onAddress: (address: MapAddress) => void;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const searchElement = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const [status, setStatus] = useState<PickerStatus>('idle');
  const [message, setMessage] = useState('');
  const apiKey = publicEnv.googleMapsApiKey;

  async function selectPosition(
    position: google.maps.LatLngLiteral,
    zoom = 17,
  ) {
    if (!map.current || !marker.current || !geocoder.current) return;
    marker.current.setPosition(position);
    map.current.panTo(position);
    map.current.setZoom(zoom);
    setStatus('geocoding');
    setMessage('Finding the postal address…');
    try {
      const response = await geocoder.current.geocode({ location: position });
      if (!response.results[0])
        throw new Error('No address was found for this point.');
      const address = parseAddress(response.results[0], position);
      onAddress(address);
      setStatus('ready');
      setMessage(
        address.pincode
          ? 'Location selected. Review the address below.'
          : 'Location selected, but the pincode needs to be entered manually.',
      );
    } catch {
      onAddress({
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        latitude: position.lat.toFixed(8),
        longitude: position.lng.toFixed(8),
      });
      setStatus('error');
      setMessage(
        'We saved the map pin, but could not resolve its postal address. Please complete the fields manually.',
      );
    }
  }

  useEffect(() => {
    if (!apiKey || !mapElement.current || !searchElement.current) return;
    let active = true;
    let placeAutocomplete: google.maps.places.PlaceAutocompleteElement | null =
      null;
    setStatus('loading-map');
    setMessage('Loading Google Maps…');

    setOptions({ key: apiKey, v: 'weekly', language: 'en', region: 'IN' });
    Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
      importLibrary('places'),
      importLibrary('geocoding'),
    ])
      .then(([, , placesLibrary]) => {
        if (!active || !mapElement.current || !searchElement.current) return;
        map.current = new google.maps.Map(mapElement.current, {
          center: INDIA_CENTER,
          zoom: 5,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        marker.current = new google.maps.Marker({
          map: map.current,
          draggable: true,
        });
        geocoder.current = new google.maps.Geocoder();

        placeAutocomplete = new placesLibrary.PlaceAutocompleteElement({
          includedRegionCodes: ['in'],
          placeholder: 'Search for an address or venue',
          requestedLanguage: 'en',
          requestedRegion: 'in',
        });
        placeAutocomplete.className = 'block w-full';
        placeAutocomplete.addEventListener('gmp-select', async (event) => {
          setStatus('geocoding');
          setMessage('Loading the selected place…');
          try {
            const place = event.placePrediction.toPlace();
            await place.fetchFields({ fields: ['location'] });
            const location = place.location;
            if (!location) throw new Error('Selected place has no location');
            await selectPosition({ lat: location.lat(), lng: location.lng() });
          } catch {
            setStatus('error');
            setMessage(
              'We could not load that place. Try another result or choose a point on the map.',
            );
          }
        });
        placeAutocomplete.addEventListener('gmp-error', () => {
          setStatus('error');
          setMessage(
            'Place search is temporarily unavailable. You can still choose a point on the map.',
          );
        });
        searchElement.current.replaceChildren(placeAutocomplete);

        map.current.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng)
            void selectPosition({
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            });
        });
        marker.current.addListener('dragend', () => {
          const position = marker.current?.getPosition();
          if (position)
            void selectPosition({ lat: position.lat(), lng: position.lng() });
        });
        setStatus('idle');
        setMessage(
          'Search, click the map, drag the pin, or use your current location.',
        );
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
        setMessage(
          'Google Maps could not load. You can still enter the address manually.',
        );
      });

    return () => {
      active = false;
      placeAutocomplete?.remove();
    };
  }, [apiKey]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage(
        'This browser does not support location access. Please choose a point on the map or enter it manually.',
      );
      return;
    }
    setStatus('locating');
    setMessage('Getting your accurate location…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        void selectPosition(
          { lat: coords.latitude, lng: coords.longitude },
          18,
        ),
      (error) => {
        setStatus('error');
        if (error.code === error.PERMISSION_DENIED)
          setMessage(
            'Location permission was denied. Allow it in Chrome settings or choose a point on the map.',
          );
        else if (error.code === error.TIMEOUT)
          setMessage(
            'Location request timed out. Try again or choose a point on the map.',
          );
        else
          setMessage(
            'Your current location is unavailable. Search or choose a point on the map instead.',
          );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-900">
          Map selection is not configured
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-800">
          Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable place search and map
          selection. Manual address entry remains available.
        </p>
      </div>
    );
  }

  const busy =
    status === 'loading-map' || status === 'locating' || status === 'geocoding';

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div
          ref={searchElement}
          className="min-h-12 flex-1"
          aria-label="Search Google Maps"
        />
        <Button
          type="button"
          variant="outline"
          onClick={useCurrentLocation}
          disabled={busy}
        >
          {status === 'locating' ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="mr-2 h-4 w-4" />
          )}
          Use my location
        </Button>
      </div>
      <div
        ref={mapElement}
        className="mt-4 h-[320px] w-full overflow-hidden rounded-xl border bg-muted sm:h-[420px]"
        aria-label="Choose address on Google Map"
      />
      <p
        className="mt-3 flex items-start gap-2 text-sm text-muted-foreground"
        role="status"
      >
        {busy ? (
          <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
        ) : (
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        )}
        {message}
      </p>
    </div>
  );
}
